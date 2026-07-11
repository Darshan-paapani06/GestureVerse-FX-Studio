import { clamp, distance, distance3, midpoint } from '../lib/math'
import type { GestureId, GestureReading, HandData, Landmark, VisionSnapshot } from '../types/studio'

type MotionPoint = { x: number; y: number; z: number; t: number }

type HoldState = {
  startedAt: number
  lastSeenAt: number
  anchor: { x: number; y: number }
  charge: number
}

const LABELS: Record<GestureId, string> = {
  none: 'No gesture',
  swipe_left: 'Swipe Left',
  swipe_right: 'Swipe Right',
  both_fists: 'Both Fists',
  crossed_hands: 'Crossed Hands',
  palm_push: 'Palm Push',
  raised_fist: 'Raised Fist',
  downward_punch: 'Downward Punch',
  hands_together_push: 'Hands Together Push',
  double_swipe: 'Double Swipe',
  circle: 'Circular Motion',
  pinch_rotate: 'Pinch & Rotate',
  arms_open: 'Arms Open',
  pinch_hold: 'Pinch Hold',
  cupped_hands: 'Cupped Hands',
  double_open_palms: 'Two Open Palms',
  double_circle: 'Two-Hand Circle'
}

export class GestureEngine {
  private history = new Map<string, MotionPoint[]>()
  private holds = new Map<GestureId, HoldState>()
  private cooldowns = new Map<GestureId, number>()
  private lastSwipeAt = 0
  private lastSwipeDirection: GestureId = 'none'

  analyze(snapshot: VisionSnapshot): GestureReading {
    const now = snapshot.timestamp || performance.now()
    this.updateHistory(snapshot.hands, now)

    const crossed = this.detectCrossedHands(snapshot.pose)
    if (crossed) return this.handleHold('crossed_hands', crossed.confidence, crossed.anchor, now, 500)
    const crossedRelease = this.releaseIfNeeded('crossed_hands', now)
    if (crossedRelease) return crossedRelease

    const fists = snapshot.hands.length >= 2 && snapshot.hands.slice(0, 2).every(hand => this.isFist(hand.landmarks))
    if (fists) {
      const anchor = midpoint(snapshot.hands[0].landmarks[0], snapshot.hands[1].landmarks[0])
      return this.handleHold('both_fists', 0.9, anchor, now, 1600)
    }
    const fistsRelease = this.releaseIfNeeded('both_fists', now)
    if (fistsRelease) return fistsRelease

    const twoHand = this.detectTwoHandGestures(snapshot.hands, now)
    if (twoHand) return twoHand

    const poseGesture = this.detectPoseGesture(snapshot.pose, snapshot.hands, now)
    if (poseGesture) return poseGesture

    const motionGesture = this.detectMotionGesture(snapshot.hands, now)
    if (motionGesture) return motionGesture

    const singleHand = this.detectSingleHandGesture(snapshot.hands, now)
    if (singleHand) return singleHand

    const pinchRelease = this.releaseIfNeeded('pinch_hold', now)
    if (pinchRelease) return pinchRelease

    return this.reading('none', 0, 'pulse', { x: 0.5, y: 0.5 }, now)
  }

  private updateHistory(hands: HandData[], now: number) {
    const seen = new Set<string>()
    for (const hand of hands) {
      const key = hand.handedness
      seen.add(key)
      const wrist = hand.landmarks[0]
      const list = this.history.get(key) ?? []
      list.push({ x: wrist.x, y: wrist.y, z: wrist.z, t: now })
      this.history.set(key, list.filter(point => now - point.t <= 900).slice(-32))
    }
    for (const key of this.history.keys()) {
      if (!seen.has(key)) {
        const list = this.history.get(key) ?? []
        this.history.set(key, list.filter(point => now - point.t <= 400))
      }
    }
  }

  private detectCrossedHands(pose: Landmark[]) {
    if (pose.length < 17) return null
    const leftShoulder = pose[11]
    const rightShoulder = pose[12]
    const leftWrist = pose[15]
    const rightWrist = pose[16]
    const visible = [leftShoulder, rightShoulder, leftWrist, rightWrist].every(point => (point.visibility ?? 1) > 0.45)
    if (!visible) return null

    const shoulderWidth = Math.max(distance(leftShoulder, rightShoulder), 0.12)
    const crossedX = leftWrist.x > rightWrist.x
    const nearChest = Math.abs(leftWrist.y - leftShoulder.y) < shoulderWidth * 0.95 && Math.abs(rightWrist.y - rightShoulder.y) < shoulderWidth * 0.95
    const close = distance(leftWrist, rightWrist) < shoulderWidth * 1.25
    const nearOpposite = distance(leftWrist, rightShoulder) < shoulderWidth * 1.35 && distance(rightWrist, leftShoulder) < shoulderWidth * 1.35
    if (!crossedX || !nearChest || !close || !nearOpposite) return null

    const confidence = clamp(0.65 + (1 - distance(leftWrist, rightWrist) / (shoulderWidth * 1.25)) * 0.3)
    return { confidence, anchor: midpoint(leftWrist, rightWrist) }
  }

  private detectTwoHandGestures(hands: HandData[], now: number): GestureReading | null {
    if (hands.length < 2) return null
    const [first, second] = hands
    const firstWrist = first.landmarks[0]
    const secondWrist = second.landmarks[0]
    const center = midpoint(firstWrist, secondWrist)
    const wristDistance = distance(firstWrist, secondWrist)
    const openA = this.isOpenPalm(first.landmarks)
    const openB = this.isOpenPalm(second.landmarks)
    const pinchA = this.isPinch(first.landmarks)
    const pinchB = this.isPinch(second.landmarks)

    if (openA && openB && wristDistance > 0.2 && this.canTrigger('double_open_palms', now, 1300)) {
      this.markTriggered('double_open_palms', now)
      return this.reading('double_open_palms', 0.88, 'pulse', center, now, undefined, { x: 0, y: -1 })
    }

    const avgExtended = (this.extendedFingerCount(first.landmarks) + this.extendedFingerCount(second.landmarks)) / 2
    if (wristDistance > 0.07 && wristDistance < 0.24 && avgExtended >= 1 && avgExtended <= 3 && this.canTrigger('cupped_hands', now, 1200)) {
      this.markTriggered('cupped_hands', now)
      return this.reading('cupped_hands', 0.78, 'pulse', center, now, { x: secondWrist.x, y: secondWrist.y })
    }

    if (pinchA && pinchB) {
      const circleA = this.circleScore(this.history.get(first.handedness) ?? [])
      const circleB = this.circleScore(this.history.get(second.handedness) ?? [])
      if (circleA > 0.72 && circleB > 0.72 && this.canTrigger('double_circle', now, 1800)) {
        this.markTriggered('double_circle', now)
        return this.reading('double_circle', Math.min(circleA, circleB), 'pulse', center, now)
      }
    }

    if (wristDistance < 0.14) {
      const histA = this.history.get(first.handedness) ?? []
      const histB = this.history.get(second.handedness) ?? []
      if (histA.length > 4 && histB.length > 4) {
        const zStart = (histA[0].z + histB[0].z) / 2
        const zEnd = (histA.at(-1)!.z + histB.at(-1)!.z) / 2
        const push = zStart - zEnd
        if (push > 0.08 && this.canTrigger('hands_together_push', now, 1500)) {
          this.markTriggered('hands_together_push', now)
          return this.reading('hands_together_push', clamp(0.7 + push * 2), 'pulse', center, now, undefined, { x: 0, y: -1 })
        }
      }
    }

    return null
  }

  private detectPoseGesture(pose: Landmark[], hands: HandData[], now: number): GestureReading | null {
    if (pose.length < 17) return null
    const leftShoulder = pose[11]
    const rightShoulder = pose[12]
    const leftWrist = pose[15]
    const rightWrist = pose[16]
    const shoulderWidth = Math.max(distance(leftShoulder, rightShoulder), 0.1)

    const armsOpen = leftWrist.x < leftShoulder.x - shoulderWidth * 0.55 && rightWrist.x > rightShoulder.x + shoulderWidth * 0.55
    const level = Math.abs(leftWrist.y - leftShoulder.y) < shoulderWidth && Math.abs(rightWrist.y - rightShoulder.y) < shoulderWidth
    if (armsOpen && level && this.canTrigger('arms_open', now, 2200)) {
      this.markTriggered('arms_open', now)
      return this.reading('arms_open', 0.88, 'pulse', midpoint(leftWrist, rightWrist), now, { x: rightWrist.x, y: rightWrist.y })
    }

    const fistHand = hands.find(hand => this.isFist(hand.landmarks))
    if (fistHand) {
      const wrist = fistHand.landmarks[0]
      const shoulder = fistHand.handedness === 'Left' ? leftShoulder : rightShoulder
      if (wrist.y < shoulder.y - shoulderWidth * 0.45 && this.canTrigger('raised_fist', now, 1700)) {
        this.markTriggered('raised_fist', now)
        return this.reading('raised_fist', 0.84, 'pulse', { x: wrist.x, y: wrist.y }, now)
      }
    }

    return null
  }

  private detectMotionGesture(hands: HandData[], now: number): GestureReading | null {
    for (const hand of hands) {
      const history = this.history.get(hand.handedness) ?? []
      if (history.length < 4) continue
      const recent = history.filter(point => now - point.t <= 480)
      if (recent.length < 3) continue
      const start = recent[0]
      const end = recent.at(-1)!
      const dt = Math.max((end.t - start.t) / 1000, 0.05)
      const dx = end.x - start.x
      const dy = end.y - start.y
      const speedX = Math.abs(dx) / dt
      const speedY = Math.abs(dy) / dt

      if (Math.abs(dx) > 0.18 && Math.abs(dy) < 0.15 && speedX > 0.55) {
        const id: GestureId = dx > 0 ? 'swipe_right' : 'swipe_left'
        if (this.canTrigger(id, now, 650)) {
          this.markTriggered(id, now)
          const isDouble = now - this.lastSwipeAt < 650 && this.lastSwipeDirection === id
          this.lastSwipeAt = now
          this.lastSwipeDirection = id
          if (isDouble && this.canTrigger('double_swipe', now, 1400)) {
            this.markTriggered('double_swipe', now)
            return this.reading('double_swipe', clamp(0.78 + speedX * 0.08), 'pulse', { x: end.x, y: end.y }, now, undefined, { x: Math.sign(dx), y: 0 })
          }
          return this.reading(id, clamp(0.72 + speedX * 0.12), 'pulse', { x: end.x, y: end.y }, now, undefined, { x: Math.sign(dx), y: dy })
        }
      }

      if (dy > 0.2 && speedY > 0.55 && this.isFist(hand.landmarks) && this.canTrigger('downward_punch', now, 1200)) {
        this.markTriggered('downward_punch', now)
        return this.reading('downward_punch', clamp(0.72 + speedY * 0.12), 'pulse', { x: end.x, y: end.y }, now, undefined, { x: dx, y: 1 })
      }

      const circle = this.circleScore(recent)
      if (circle > 0.78 && this.canTrigger('circle', now, 1700)) {
        this.markTriggered('circle', now)
        return this.reading('circle', circle, 'pulse', { x: end.x, y: end.y }, now)
      }

      if (this.isOpenPalm(hand.landmarks) && Math.abs(dx) < 0.12 && Math.abs(dy) < 0.12) {
        const zDelta = start.z - end.z
        if (zDelta > 0.1 && this.canTrigger('palm_push', now, 1100)) {
          this.markTriggered('palm_push', now)
          return this.reading('palm_push', clamp(0.7 + zDelta * 2), 'pulse', { x: end.x, y: end.y }, now, undefined, { x: 0, y: -1 })
        }
      }
    }
    return null
  }

  private detectSingleHandGesture(hands: HandData[], now: number): GestureReading | null {
    const pinch = hands.find(hand => this.isPinch(hand.landmarks))
    if (!pinch) return null
    const thumb = pinch.landmarks[4]
    const index = pinch.landmarks[8]
    const anchor = midpoint(thumb, index)
    const history = this.history.get(pinch.handedness) ?? []
    const circle = this.circleScore(history)
    if (circle > 0.62 && this.canTrigger('pinch_rotate', now, 1500)) {
      this.markTriggered('pinch_rotate', now)
      return this.reading('pinch_rotate', circle, 'pulse', anchor, now)
    }
    return this.handleHold('pinch_hold', 0.86, anchor, now, 1100)
  }

  private handleHold(id: GestureId, confidence: number, anchor: { x: number; y: number }, now: number, chargeMs: number): GestureReading {
    const existing = this.holds.get(id)
    if (!existing) {
      this.holds.set(id, { startedAt: now, lastSeenAt: now, anchor, charge: 0 })
      return this.reading(id, confidence, 'start', anchor, now, undefined, undefined, 0)
    }
    const charge = clamp((now - existing.startedAt) / chargeMs)
    existing.lastSeenAt = now
    existing.anchor = anchor
    existing.charge = charge
    return this.reading(id, confidence, 'hold', anchor, now, undefined, undefined, charge)
  }

  private releaseIfNeeded(id: GestureId, now: number): GestureReading | null {
    const hold = this.holds.get(id)
    if (!hold) return null
    if (now - hold.lastSeenAt < 90) return null
    this.holds.delete(id)
    return this.reading(id, 0.9, 'release', hold.anchor, now, undefined, undefined, hold.charge)
  }

  private reading(
    id: GestureId,
    confidence: number,
    phase: GestureReading['phase'],
    anchor: { x: number; y: number },
    timestamp: number,
    secondary?: { x: number; y: number },
    direction?: { x: number; y: number },
    charge?: number
  ): GestureReading {
    return { id, label: LABELS[id], confidence: clamp(confidence), phase, anchor, secondary, direction, charge, timestamp }
  }

  private extendedFingerCount(landmarks: Landmark[]) {
    if (landmarks.length < 21) return 0
    const wrist = landmarks[0]
    const tips = [4, 8, 12, 16, 20]
    const joints = [3, 6, 10, 14, 18]
    return tips.reduce((count, tip, index) => {
      const tipDistance = distance3(landmarks[tip], wrist)
      const jointDistance = distance3(landmarks[joints[index]], wrist)
      return count + (tipDistance > jointDistance * 1.11 ? 1 : 0)
    }, 0)
  }

  private isFist(landmarks: Landmark[]) {
    if (landmarks.length < 21) return false
    const count = this.extendedFingerCount(landmarks)
    const palm = Math.max(distance3(landmarks[0], landmarks[9]), 0.04)
    const averageTip = [4, 8, 12, 16, 20].reduce((sum, index) => sum + distance3(landmarks[index], landmarks[9]), 0) / 5
    return count <= 1 && averageTip < palm * 1.7
  }

  private isOpenPalm(landmarks: Landmark[]) {
    return this.extendedFingerCount(landmarks) >= 4
  }

  private isPinch(landmarks: Landmark[]) {
    if (landmarks.length < 21) return false
    const palm = Math.max(distance3(landmarks[0], landmarks[9]), 0.04)
    return distance3(landmarks[4], landmarks[8]) < palm * 0.55
  }

  private circleScore(points: MotionPoint[]) {
    const recent = points.slice(-18)
    if (recent.length < 9) return 0
    const center = recent.reduce((acc, point) => ({ x: acc.x + point.x / recent.length, y: acc.y + point.y / recent.length }), { x: 0, y: 0 })
    const radius = recent.reduce((sum, point) => sum + Math.hypot(point.x - center.x, point.y - center.y), 0) / recent.length
    if (radius < 0.035) return 0
    let angularTravel = 0
    for (let index = 1; index < recent.length; index += 1) {
      const a = Math.atan2(recent[index - 1].y - center.y, recent[index - 1].x - center.x)
      const b = Math.atan2(recent[index].y - center.y, recent[index].x - center.x)
      let delta = b - a
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      angularTravel += delta
    }
    const closure = 1 - clamp(Math.hypot(recent[0].x - recent.at(-1)!.x, recent[0].y - recent.at(-1)!.y) / (radius * 2.5))
    const rotation = clamp(Math.abs(angularTravel) / (Math.PI * 1.6))
    return clamp(rotation * 0.72 + closure * 0.28)
  }

  private canTrigger(id: GestureId, now: number, cooldownMs: number) {
    return now - (this.cooldowns.get(id) ?? -Infinity) >= cooldownMs
  }

  private markTriggered(id: GestureId, now: number) {
    this.cooldowns.set(id, now)
  }
}
