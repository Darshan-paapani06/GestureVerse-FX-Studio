import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { coverRect, rgba } from '../lib/math'
import type { StudioSettings, VisionSnapshot } from '../types/studio'
import type { EffectEngine } from '../vfx/EffectEngine'

const HAND_CONNECTIONS: Array<[number, number]> = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]]
const POSE_CONNECTIONS: Array<[number, number]> = [[0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],[9,10],[11,12],[11,13],[13,15],[15,17],[15,19],[15,21],[17,19],[12,14],[14,16],[16,18],[16,20],[16,22],[18,20],[11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28],[27,29],[28,30],[29,31],[30,32],[27,31],[28,32]]

export type StudioCanvasHandle = {
  getCanvas: () => HTMLCanvasElement | null
}

type Props = {
  video: HTMLVideoElement | null
  visionRef: React.MutableRefObject<VisionSnapshot>
  settings: StudioSettings
  effectEngine: EffectEngine
  cameraReady: boolean
  activeGestureLabel: string
}

const LANDSCAPE = {
  eco: [640, 360],
  balanced: [960, 540],
  cinematic: [1280, 720]
} as const

const getDimensions = (settings: StudioSettings) => {
  const [baseWidth, baseHeight] = LANDSCAPE[settings.performance]
  if (settings.captureAspect === 'portrait') return [baseHeight, baseWidth]
  if (settings.captureAspect === 'square') return [Math.min(baseWidth, baseHeight + 240), Math.min(baseWidth, baseHeight + 240)]
  return [baseWidth, baseHeight]
}

export const StudioCanvas = forwardRef<StudioCanvasHandle, Props>(function StudioCanvas(
  { video, visionRef, settings, effectEngine, cameraReady, activeGestureLabel },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const personCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const backgroundImageRef = useRef<HTMLImageElement | null>(null)
  const settingsRef = useRef(settings)
  const gestureRef = useRef(activeGestureLabel)

  settingsRef.current = settings
  gestureRef.current = activeGestureLabel

  useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }), [])

  useEffect(() => {
    if (!settings.backgroundImage) {
      backgroundImageRef.current = null
      return
    }
    const image = new Image()
    image.onload = () => { backgroundImageRef.current = image }
    image.src = settings.backgroundImage
  }, [settings.backgroundImage])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return
    let frameId = 0

    const render = (now: number) => {
      const currentSettings = settingsRef.current
      const [width, height] = getDimensions(currentSettings)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        personCanvasRef.current.width = width
        personCanvasRef.current.height = height
      }

      context.save()
      context.clearRect(0, 0, width, height)
      context.fillStyle = '#02040a'
      context.fillRect(0, 0, width, height)

      const shake = effectEngine.getShake(now, currentSettings.screenShake)
      context.translate(shake.x, shake.y)

      if (cameraReady && video && video.videoWidth > 0) {
        const rect = coverRect(video.videoWidth, video.videoHeight, width, height)
        drawCameraScene(context, video, rect, width, height, visionRef.current, currentSettings, personCanvasRef.current, backgroundImageRef.current)
        if (currentSettings.showSkeleton) drawSkeleton(context, rect, visionRef.current, currentSettings)
        drawFaceEffects(context, rect, visionRef.current, currentSettings, now)
      } else {
        drawStandby(context, width, height, now)
      }

      effectEngine.render(context, width, height, now, currentSettings, visionRef.current)
      drawWatermark(context, width, height, gestureRef.current)
      context.restore()

      frameId = requestAnimationFrame(render)
    }

    frameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frameId)
  }, [cameraReady, effectEngine, video, visionRef])

  return <canvas ref={canvasRef} className="studio-canvas" aria-label="GestureVerse live camera and effects canvas" />
})

type Rect = { x: number; y: number; width: number; height: number }

function drawVideo(ctx: CanvasRenderingContext2D, source: CanvasImageSource, rect: Rect, canvasWidth: number, mirror: boolean) {
  ctx.save()
  if (mirror) {
    ctx.translate(canvasWidth, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height)
  ctx.restore()
}

function drawCameraScene(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  rect: Rect,
  width: number,
  height: number,
  vision: VisionSnapshot,
  settings: StudioSettings,
  personCanvas: HTMLCanvasElement,
  backgroundImage: HTMLImageElement | null
) {
  if (settings.backgroundMode === 'real') {
    drawVideo(ctx, video, rect, width, settings.mirror)
    drawCinematicGrade(ctx, width, height)
    return
  }

  if (settings.backgroundMode === 'upload' && backgroundImage) {
    const bgRect = coverRect(backgroundImage.naturalWidth, backgroundImage.naturalHeight, width, height)
    ctx.drawImage(backgroundImage, bgRect.x, bgRect.y, bgRect.width, bgRect.height)
    ctx.fillStyle = 'rgba(1, 5, 15, .18)'
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.save()
    ctx.filter = settings.performance === 'eco' ? 'blur(10px) brightness(.58)' : 'blur(18px) brightness(.52) saturate(1.12)'
    const expanded = { x: rect.x - 28, y: rect.y - 28, width: rect.width + 56, height: rect.height + 56 }
    drawVideo(ctx, video, expanded, width, settings.mirror)
    ctx.restore()
  }

  if (vision.segmentationMask) {
    const pctx = personCanvas.getContext('2d')
    if (pctx) {
      pctx.clearRect(0, 0, width, height)
      pctx.globalCompositeOperation = 'source-over'
      pctx.filter = settings.performance === 'cinematic' ? 'blur(1px)' : 'none'
      pctx.drawImage(vision.segmentationMask, rect.x, rect.y, rect.width, rect.height)
      pctx.filter = 'none'
      pctx.globalCompositeOperation = 'source-in'
      drawVideo(pctx, video, rect, width, settings.mirror)
      pctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(personCanvas, 0, 0)
    }
  } else {
    ctx.save()
    ctx.globalAlpha = 0.82
    drawVideo(ctx, video, rect, width, settings.mirror)
    ctx.restore()
  }

  drawCinematicGrade(ctx, width, height)
}

function drawCinematicGrade(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const vignette = ctx.createRadialGradient(width / 2, height * 0.46, height * 0.12, width / 2, height * 0.5, Math.max(width, height) * 0.68)
  vignette.addColorStop(0, 'rgba(4, 10, 26, 0)')
  vignette.addColorStop(0.72, 'rgba(3, 7, 18, .08)')
  vignette.addColorStop(1, 'rgba(0, 2, 8, .58)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)

  const topGlow = ctx.createLinearGradient(0, 0, 0, height)
  topGlow.addColorStop(0, 'rgba(43, 224, 255, .08)')
  topGlow.addColorStop(0.34, 'rgba(80, 58, 255, .025)')
  topGlow.addColorStop(1, 'rgba(0,0,0,.08)')
  ctx.fillStyle = topGlow
  ctx.fillRect(0, 0, width, height)
}

function mapPoint(point: { x: number; y: number }, rect: Rect) {
  return { x: rect.x + point.x * rect.width, y: rect.y + point.y * rect.height }
}

function drawSkeleton(ctx: CanvasRenderingContext2D, rect: Rect, vision: VisionSnapshot, settings: StudioSettings) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.lineWidth = 1.4
  ctx.shadowBlur = 9
  ctx.shadowColor = '#4eeaff'

  for (const hand of vision.hands) {
    ctx.strokeStyle = 'rgba(57, 231, 255, .76)'
    for (const [start, end] of HAND_CONNECTIONS) {
      const a = hand.landmarks[start]
      const b = hand.landmarks[end]
      if (!a || !b) continue
      const pa = mapPoint(a, rect)
      const pb = mapPoint(b, rect)
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(pb.x, pb.y)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(245, 253, 255, .88)'
    for (const landmark of hand.landmarks) {
      const point = mapPoint(landmark, rect)
      ctx.beginPath()
      ctx.arc(point.x, point.y, settings.performance === 'eco' ? 1.6 : 2.3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (vision.pose.length) {
    ctx.strokeStyle = 'rgba(139, 93, 255, .48)'
    ctx.shadowColor = '#8b5dff'
    for (const [start, end] of POSE_CONNECTIONS) {
      const a = vision.pose[start]
      const b = vision.pose[end]
      if (!a || !b || (a.visibility ?? 1) < 0.45 || (b.visibility ?? 1) < 0.45) continue
      const pa = mapPoint(a, rect)
      const pb = mapPoint(b, rect)
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(pb.x, pb.y)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawFaceEffects(ctx: CanvasRenderingContext2D, rect: Rect, vision: VisionSnapshot, settings: StudioSettings, now: number) {
  if (settings.performance === 'eco' || vision.face.length < 468) return
  const face = vision.face
  const leftEye = averagePoints([33, 133, 159, 145].map(index => face[index]))
  const rightEye = averagePoints([362, 263, 386, 374].map(index => face[index]))
  const forehead = face[10]
  const leftCheek = face[234]
  const rightCheek = face[454]
  const nose = face[1]
  if (!leftEye || !rightEye || !forehead || !leftCheek || !rightCheek || !nose) return

  const left = mapPoint(leftEye, rect)
  const right = mapPoint(rightEye, rect)
  const top = mapPoint(forehead, rect)
  const cheekA = mapPoint(leftCheek, rect)
  const cheekB = mapPoint(rightCheek, rect)
  const nosePoint = mapPoint(nose, rect)
  const eyeDistance = Math.hypot(left.x - right.x, left.y - right.y)
  const pulse = 0.82 + Math.sin(now * 0.008) * 0.18

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  if (settings.faceGlowingEyes) {
    for (const eye of [left, right]) {
      const gradient = ctx.createRadialGradient(eye.x, eye.y, 0, eye.x, eye.y, eyeDistance * 0.23)
      gradient.addColorStop(0, 'rgba(255,255,255,.98)')
      gradient.addColorStop(0.22, `rgba(70,235,255,${0.95 * pulse})`)
      gradient.addColorStop(1, 'rgba(42,180,255,0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(eye.x, eye.y, eyeDistance * 0.23, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (settings.faceEnergyMask) {
    ctx.strokeStyle = 'rgba(96, 224, 255, .58)'
    ctx.shadowColor = '#4eeaff'
    ctx.shadowBlur = 15
    ctx.lineWidth = Math.max(1, eyeDistance * 0.025)
    ctx.beginPath()
    ctx.moveTo(cheekA.x, cheekA.y)
    ctx.lineTo(left.x, left.y)
    ctx.lineTo(nosePoint.x, nosePoint.y)
    ctx.lineTo(right.x, right.y)
    ctx.lineTo(cheekB.x, cheekB.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(left.x, left.y)
    ctx.lineTo(top.x, top.y + eyeDistance * 0.12)
    ctx.lineTo(right.x, right.y)
    ctx.stroke()
  }

  if (settings.faceCrown) {
    const crownY = top.y - eyeDistance * 0.45
    ctx.strokeStyle = 'rgba(186, 119, 255, .75)'
    ctx.shadowColor = '#b66aff'
    ctx.shadowBlur = 18
    ctx.lineWidth = Math.max(1.5, eyeDistance * 0.028)
    ctx.beginPath()
    ctx.moveTo(top.x - eyeDistance * 0.65, crownY + eyeDistance * 0.22)
    ctx.lineTo(top.x - eyeDistance * 0.35, crownY - eyeDistance * 0.18)
    ctx.lineTo(top.x, crownY + eyeDistance * 0.04)
    ctx.lineTo(top.x + eyeDistance * 0.35, crownY - eyeDistance * 0.18)
    ctx.lineTo(top.x + eyeDistance * 0.65, crownY + eyeDistance * 0.22)
    ctx.stroke()
  }
  ctx.restore()
}

function averagePoints(points: Array<{ x: number; y: number } | undefined>) {
  const valid = points.filter(Boolean) as Array<{ x: number; y: number }>
  if (!valid.length) return null
  return valid.reduce((acc, point) => ({ x: acc.x + point.x / valid.length, y: acc.y + point.y / valid.length }), { x: 0, y: 0 })
}

function drawStandby(ctx: CanvasRenderingContext2D, width: number, height: number, now: number) {
  const grid = Math.max(28, Math.round(width / 28))
  ctx.strokeStyle = 'rgba(56, 223, 255, .055)'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += grid) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += grid) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  const radius = Math.min(width, height) * 0.16
  const pulse = 1 + Math.sin(now * 0.0025) * 0.04
  ctx.save()
  ctx.translate(width / 2, height / 2 - radius * 0.25)
  ctx.rotate(now * 0.00035)
  ctx.strokeStyle = 'rgba(57, 231, 255, .7)'
  ctx.shadowColor = '#39e7ff'
  ctx.shadowBlur = 30
  ctx.lineWidth = Math.max(2, radius * 0.025)
  ctx.setLineDash([radius * 0.28, radius * 0.12])
  ctx.beginPath()
  ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.rotate(-now * 0.0007)
  ctx.strokeStyle = 'rgba(151, 92, 255, .72)'
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2)
  ctx.stroke()
  drawHandMark(ctx, radius)
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#eefcff'
  ctx.font = `700 ${Math.max(20, width * 0.03)}px system-ui, sans-serif`
  ctx.fillText('GESTUREVERSE FX STUDIO', width / 2, height * 0.75)
  ctx.fillStyle = 'rgba(219, 240, 255, .62)'
  ctx.font = `500 ${Math.max(11, width * 0.014)}px system-ui, sans-serif`
  ctx.fillText('Camera standby · Control the impossible', width / 2, height * 0.81)
}

function drawHandMark(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.save()
  ctx.rotate(-0.1)
  ctx.strokeStyle = 'rgba(240, 253, 255, .9)'
  ctx.shadowColor = '#50e8ff'
  ctx.shadowBlur = 12
  ctx.lineWidth = Math.max(2, radius * 0.035)
  ctx.beginPath()
  ctx.moveTo(-radius * 0.28, radius * 0.42)
  ctx.quadraticCurveTo(-radius * 0.34, radius * 0.1, -radius * 0.28, -radius * 0.2)
  ctx.lineTo(-radius * 0.18, -radius * 0.58)
  ctx.quadraticCurveTo(-radius * 0.06, -radius * 0.68, 0, -radius * 0.51)
  ctx.lineTo(radius * 0.02, -radius * 0.72)
  ctx.quadraticCurveTo(radius * 0.14, -radius * 0.82, radius * 0.2, -radius * 0.62)
  ctx.lineTo(radius * 0.18, -radius * 0.47)
  ctx.lineTo(radius * 0.29, -radius * 0.64)
  ctx.quadraticCurveTo(radius * 0.4, -radius * 0.66, radius * 0.42, -radius * 0.46)
  ctx.lineTo(radius * 0.38, -radius * 0.26)
  ctx.lineTo(radius * 0.48, -radius * 0.38)
  ctx.quadraticCurveTo(radius * 0.61, -radius * 0.34, radius * 0.56, -radius * 0.12)
  ctx.lineTo(radius * 0.4, radius * 0.35)
  ctx.quadraticCurveTo(radius * 0.26, radius * 0.58, -radius * 0.28, radius * 0.42)
  ctx.stroke()
  ctx.restore()
}

function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number, gesture: string) {
  const pad = Math.max(12, width * 0.016)
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.font = `600 ${Math.max(10, width * 0.011)}px system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(235, 250, 255, .78)'
  ctx.fillText('GESTUREVERSE FX STUDIO', pad, height - pad)
  ctx.font = `500 ${Math.max(9, width * 0.009)}px system-ui, sans-serif`
  ctx.fillStyle = 'rgba(190, 223, 238, .52)'
  ctx.fillText('DARSHAN PAAPANI', pad, height - pad - Math.max(14, width * 0.014))

  if (gesture && gesture !== 'No gesture') {
    const textWidth = ctx.measureText(gesture.toUpperCase()).width
    const boxWidth = textWidth + pad * 1.6
    const boxHeight = Math.max(26, width * 0.027)
    ctx.fillStyle = 'rgba(3, 10, 24, .56)'
    ctx.strokeStyle = rgba('#39e7ff', 0.34)
    ctx.lineWidth = 1
    roundRect(ctx, width - boxWidth - pad, pad, boxWidth, boxHeight, boxHeight / 2)
    ctx.fill()
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(232, 252, 255, .88)'
    ctx.fillText(gesture.toUpperCase(), width - boxWidth / 2 - pad, pad + boxHeight * 0.67)
  }
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}
