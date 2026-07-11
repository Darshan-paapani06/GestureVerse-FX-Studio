import { getEffect } from '../data/effects'
import { clamp, easeOutCubic, lerp, randomBetween, rgba } from '../lib/math'
import type { ActiveEffect, EffectId, GestureId, GestureReading, StudioSettings, VisionSnapshot } from '../types/studio'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  gravity: number
  drag: number
  shape: 'dot' | 'streak' | 'shard'
  rotation: number
  spin: number
}

type TriggerPayload = {
  anchor: { x: number; y: number }
  secondary?: { x: number; y: number }
  direction?: { x: number; y: number }
  color?: string
  intensity?: number
  density?: number
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export class EffectEngine {
  private active: ActiveEffect[] = []
  private particles: Particle[] = []
  private lastFrame = performance.now()

  trigger(id: EffectId, payload: TriggerPayload) {
    const definition = getEffect(id)
    this.active.push({
      uid: uid(),
      id,
      startedAt: performance.now(),
      duration: definition.duration,
      anchor: payload.anchor,
      secondary: payload.secondary,
      direction: payload.direction,
      color: payload.color ?? definition.color,
      intensity: payload.intensity ?? 0.8
    })
    this.spawnForEffect(id, payload)
  }

  setHold(id: EffectId, gesture: GestureId, reading: GestureReading, color: string, baseIntensity: number, density: number) {
    const existing = this.active.find(effect => effect.holdKey === gesture && effect.releasedAt === undefined)
    if (existing) {
      existing.anchor = reading.anchor
      existing.secondary = reading.secondary
      existing.direction = reading.direction
      existing.intensity = clamp(baseIntensity * (0.55 + (reading.charge ?? 0) * 0.75), 0.2, 1.5)
      existing.color = color
      if (Math.random() < density * 0.16) {
        this.spawnAmbient(existing.anchor, color, density, id === 'power_aura' ? 2.2 : 1.2)
      }
      return
    }

    this.active.push({
      uid: uid(),
      id,
      startedAt: performance.now(),
      duration: getEffect(id).duration,
      anchor: reading.anchor,
      secondary: reading.secondary,
      direction: reading.direction,
      color,
      intensity: baseIntensity,
      holdKey: gesture
    })
    this.spawnForEffect(id, { anchor: reading.anchor, color, intensity: baseIntensity, density })
  }

  releaseHold(gesture: GestureId, charge = 0.5) {
    const now = performance.now()
    for (const effect of this.active) {
      if (effect.holdKey === gesture && effect.releasedAt === undefined) {
        effect.releasedAt = now
        effect.startedAt = now
        effect.intensity = clamp(0.6 + charge * 0.9, 0.6, 1.5)
        if (effect.id === 'power_aura') {
          this.spawnBurst(effect.anchor, effect.color, 90, 0.35 + charge * 0.35, 'streak')
        } else if (effect.id === 'energy_shield') {
          this.spawnBurst(effect.anchor, effect.color, 42, 0.2, 'shard')
        } else if (effect.id === 'telekinetic_orb') {
          this.spawnBurst(effect.anchor, effect.color, 48, 0.25, 'dot')
        }
      }
    }
  }

  clear() {
    this.active = []
    this.particles = []
  }

  getActiveIds() {
    return this.active.map(effect => effect.id)
  }

  getShake(now: number, enabled: boolean) {
    if (!enabled) return { x: 0, y: 0 }
    let strength = 0
    for (const effect of this.active) {
      const age = now - effect.startedAt
      if (['ground_shockwave', 'thunder_strike', 'ultimate_beam', 'power_aura'].includes(effect.id) && age < 350) {
        strength = Math.max(strength, (1 - age / 350) * effect.intensity)
      }
    }
    return {
      x: (Math.random() - 0.5) * 9 * strength,
      y: (Math.random() - 0.5) * 7 * strength
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    now: number,
    settings: StudioSettings,
    vision: VisionSnapshot
  ) {
    const dt = clamp((now - this.lastFrame) / 1000, 0, 0.05)
    this.lastFrame = now

    this.active = this.active.filter(effect => {
      if (effect.holdKey && effect.releasedAt === undefined) return true
      const elapsed = effect.releasedAt ? now - effect.releasedAt : now - effect.startedAt
      return elapsed <= effect.duration
    })

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const effect of this.active) this.drawEffect(ctx, width, height, now, effect, settings, vision)
    this.updateAndDrawParticles(ctx, width, height, dt, settings)
    ctx.restore()
  }

  private drawEffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    now: number,
    effect: ActiveEffect,
    settings: StudioSettings,
    vision: VisionSnapshot
  ) {
    const elapsed = now - effect.startedAt
    const progress = clamp(elapsed / effect.duration)
    const x = effect.anchor.x * width
    const y = effect.anchor.y * height
    const scale = Math.min(width, height)
    const intensity = effect.intensity * settings.effectIntensity
    const glow = 16 + settings.glow * 40

    ctx.save()
    ctx.shadowColor = effect.color
    ctx.shadowBlur = glow * intensity
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (effect.id) {
      case 'energy_shield':
        this.drawShield(ctx, x, y, scale, progress, intensity, effect)
        break
      case 'repulsor_blast':
        this.drawRepulsor(ctx, x, y, scale, progress, intensity, effect.color)
        break
      case 'thunder_strike':
        this.drawThunder(ctx, x, y, width, height, progress, intensity, effect.color)
        break
      case 'ground_shockwave':
        this.drawShockwave(ctx, x, Math.max(y, height * 0.68), scale, progress, intensity, effect.color)
        break
      case 'power_aura':
        this.drawAura(ctx, width, height, progress, intensity, effect, vision)
        break
      case 'energy_slash':
        this.drawSlash(ctx, x, y, width, height, progress, intensity, effect)
        break
      case 'ultimate_beam':
        this.drawBeam(ctx, x, y, width, height, progress, intensity, effect)
        break
      case 'teleport_afterimage':
        this.drawAfterimage(ctx, x, y, scale, progress, intensity, effect.color)
        break
      case 'mystic_portal':
        this.drawPortal(ctx, x, y, scale, elapsed, progress, intensity, effect.color)
        break
      case 'magic_rune':
        this.drawRune(ctx, x, y, scale, elapsed, progress, intensity, effect.color)
        break
      case 'phoenix':
        this.drawPhoenix(ctx, x, y, scale, progress, intensity, effect.color)
        break
      case 'telekinetic_orb':
        this.drawOrb(ctx, x, y, scale, elapsed, progress, intensity, effect.color)
        break
      case 'fireball':
        this.drawFireball(ctx, x, y, scale, elapsed, progress, intensity, effect.color)
        break
      case 'ice_blast':
        this.drawIce(ctx, x, y, scale, progress, intensity, effect.color)
        break
      case 'wind_vortex':
        this.drawVortex(ctx, x, y, scale, elapsed, progress, intensity, effect.color)
        break
    }

    ctx.restore()
  }

  private drawShield(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, progress: number, intensity: number, effect: ActiveEffect) {
    const released = effect.releasedAt !== undefined
    const entrance = easeOutCubic(clamp((performance.now() - (released ? effect.releasedAt! : effect.startedAt)) / 280))
    const fade = released ? 1 - progress : 1
    const radiusX = scale * 0.24 * entrance * (0.9 + intensity * 0.12)
    const radiusY = scale * 0.31 * entrance
    ctx.globalAlpha = fade

    const gradient = ctx.createRadialGradient(x, y, radiusX * 0.1, x, y, radiusX)
    gradient.addColorStop(0, rgba(effect.color, 0.04))
    gradient.addColorStop(0.72, rgba(effect.color, 0.12 * intensity))
    gradient.addColorStop(1, rgba(effect.color, 0.02))
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
    ctx.fill()

    for (let ring = 0; ring < 3; ring += 1) {
      ctx.strokeStyle = rgba(effect.color, 0.85 - ring * 0.2)
      ctx.lineWidth = Math.max(1, (4 - ring) * intensity)
      ctx.beginPath()
      ctx.ellipse(x, y, radiusX * (1 - ring * 0.12), radiusY * (1 - ring * 0.12), 0, -Math.PI * 0.8, Math.PI * 0.8)
      ctx.stroke()
    }

    ctx.lineWidth = 1.2
    ctx.strokeStyle = rgba(effect.color, 0.45)
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i += 1) {
        const yy = y - radiusY * 0.65 + i * radiusY * 0.42
        ctx.beginPath()
        ctx.moveTo(x + side * radiusX * 0.15, yy)
        ctx.lineTo(x + side * radiusX * 0.88, yy + side * 8)
        ctx.stroke()
      }
    }
  }

  private drawRepulsor(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, progress: number, intensity: number, color: string) {
    const burst = easeOutCubic(progress)
    const fade = 1 - progress
    for (let i = 0; i < 4; i += 1) {
      const radius = scale * (0.025 + burst * (0.12 + i * 0.065))
      ctx.globalAlpha = fade * (0.9 - i * 0.14)
      ctx.strokeStyle = i % 2 ? '#ffffff' : color
      ctx.lineWidth = Math.max(1, (7 - i) * intensity)
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
    const core = ctx.createRadialGradient(x, y, 0, x, y, scale * 0.08)
    core.addColorStop(0, '#ffffff')
    core.addColorStop(0.22, rgba(color, 0.95))
    core.addColorStop(1, rgba(color, 0))
    ctx.globalAlpha = fade
    ctx.fillStyle = core
    ctx.beginPath()
    ctx.arc(x, y, scale * 0.08 * (1 + burst), 0, Math.PI * 2)
    ctx.fill()
  }

  private drawThunder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number, intensity: number, color: string) {
    const fade = progress < 0.65 ? 1 : 1 - (progress - 0.65) / 0.35
    const seed = Math.floor(progress * 9)
    const drawBolt = (startX: number, startY: number, endX: number, endY: number, branches: number, alpha: number) => {
      ctx.strokeStyle = rgba(color, alpha * fade)
      ctx.lineWidth = Math.max(1, 5 * intensity * alpha)
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      const segments = 13
      for (let i = 1; i <= segments; i += 1) {
        const t = i / segments
        const jitter = i === segments ? 0 : Math.sin((i + seed) * 4.91) * width * 0.012 * (1 - t * 0.35)
        ctx.lineTo(lerp(startX, endX, t) + jitter, lerp(startY, endY, t))
      }
      ctx.stroke()
      if (branches > 0) {
        for (let i = 3; i < segments - 2; i += 4) {
          const t = i / segments
          const bx = lerp(startX, endX, t)
          const by = lerp(startY, endY, t)
          drawBolt(bx, by, bx + (i % 2 ? -1 : 1) * width * 0.08, by + height * 0.09, branches - 1, alpha * 0.55)
        }
      }
    }
    drawBolt(x + width * 0.04, -height * 0.04, x, y, 1, 1)
    ctx.fillStyle = rgba('#ffffff', fade)
    ctx.beginPath()
    ctx.arc(x, y, Math.min(width, height) * 0.027 * intensity, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawShockwave(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, progress: number, intensity: number, color: string) {
    const radius = scale * 0.5 * easeOutCubic(progress)
    const fade = 1 - progress
    ctx.save()
    ctx.scale(1, 0.32)
    const yy = y / 0.32
    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = rgba(i === 1 ? '#ffffff' : color, fade * (0.85 - i * 0.2))
      ctx.lineWidth = Math.max(1, (9 - i * 2) * intensity)
      ctx.beginPath()
      ctx.arc(x, yy, radius * (1 - i * 0.16), 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()

    ctx.strokeStyle = rgba(color, fade * 0.7)
    ctx.lineWidth = 2 * intensity
    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * Math.PI * 2
      const length = radius * randomBetween(0.35, 0.85)
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(angle) * radius * 0.12, y + Math.sin(angle) * radius * 0.04)
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length * 0.25)
      ctx.stroke()
    }
  }

  private drawAura(ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, intensity: number, effect: ActiveEffect, vision: VisionSnapshot) {
    const pose = vision.pose
    let cx = effect.anchor.x * width
    let cy = effect.anchor.y * height
    let bodyHeight = height * 0.48
    let bodyWidth = width * 0.25
    if (pose.length >= 25) {
      const shoulders = [pose[11], pose[12]]
      const hips = [pose[23], pose[24]]
      cx = ((shoulders[0].x + shoulders[1].x + hips[0].x + hips[1].x) / 4) * width
      cy = ((shoulders[0].y + shoulders[1].y + hips[0].y + hips[1].y) / 4) * height
      bodyWidth = Math.abs(shoulders[0].x - shoulders[1].x) * width * 1.5
      bodyHeight = Math.abs(((hips[0].y + hips[1].y) / 2) - ((shoulders[0].y + shoulders[1].y) / 2)) * height * 3.2
    }
    const released = effect.releasedAt !== undefined
    const fade = released ? 1 - progress : 1
    const pulse = 0.92 + Math.sin(performance.now() * 0.015) * 0.08
    ctx.globalAlpha = fade
    for (let layer = 0; layer < 4; layer += 1) {
      ctx.strokeStyle = rgba(effect.color, 0.72 - layer * 0.12)
      ctx.lineWidth = (6 - layer) * intensity
      ctx.beginPath()
      const points = 18
      for (let i = 0; i <= points; i += 1) {
        const angle = (i / points) * Math.PI * 2
        const jitter = Math.sin(i * 3.1 + performance.now() * 0.008 + layer) * bodyWidth * 0.08
        const px = cx + Math.cos(angle) * (bodyWidth * (0.65 + layer * 0.08) + jitter) * pulse
        const py = cy + Math.sin(angle) * (bodyHeight * (0.55 + layer * 0.06)) * pulse
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
    }
    if (released) {
      const radius = Math.min(width, height) * 0.6 * easeOutCubic(progress)
      ctx.strokeStyle = rgba(effect.color, (1 - progress) * 0.9)
      ctx.lineWidth = 12 * intensity * (1 - progress)
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  private drawSlash(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number, intensity: number, effect: ActiveEffect) {
    const dir = effect.direction?.x && effect.direction.x < 0 ? -1 : 1
    const travel = easeOutCubic(progress)
    const length = Math.min(width, height) * 0.7
    const startX = x - dir * length * 0.55
    const endX = startX + dir * length * travel
    const startY = y + height * 0.12
    const endY = y - height * 0.16 * travel
    const fade = 1 - Math.pow(progress, 1.7)

    for (let layer = 0; layer < 4; layer += 1) {
      ctx.strokeStyle = layer === 0 ? rgba('#ffffff', fade) : rgba(effect.color, fade * (0.9 - layer * 0.16))
      ctx.lineWidth = (5 + layer * 8) * intensity * (layer === 0 ? 0.5 : 1)
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.quadraticCurveTo(x, y - height * 0.24, endX, endY)
      ctx.stroke()
    }
  }

  private drawBeam(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number, intensity: number, effect: ActiveEffect) {
    const dirX = effect.direction?.x || (x < width / 2 ? 1 : -1)
    const direction = dirX >= 0 ? 1 : -1
    const charge = clamp(progress / 0.22)
    const release = clamp((progress - 0.16) / 0.42)
    const fade = progress > 0.78 ? 1 - (progress - 0.78) / 0.22 : 1
    const length = width * 0.75 * easeOutCubic(release)
    const endX = x + direction * length
    const beamWidth = Math.min(width, height) * 0.065 * intensity * (0.75 + Math.sin(performance.now() * 0.02) * 0.1)

    ctx.fillStyle = rgba(effect.color, 0.35 * charge * fade)
    ctx.beginPath()
    ctx.arc(x, y, Math.min(width, height) * 0.12 * charge, 0, Math.PI * 2)
    ctx.fill()

    if (release > 0) {
      const gradient = ctx.createLinearGradient(x, y, endX, y)
      gradient.addColorStop(0, rgba('#ffffff', fade))
      gradient.addColorStop(0.2, rgba(effect.color, fade))
      gradient.addColorStop(0.85, rgba(effect.color, fade * 0.72))
      gradient.addColorStop(1, rgba(effect.color, 0))
      ctx.strokeStyle = gradient
      ctx.lineWidth = beamWidth * 2.4
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(endX, y + Math.sin(progress * 18) * height * 0.008)
      ctx.stroke()
      ctx.strokeStyle = rgba('#ffffff', fade)
      ctx.lineWidth = beamWidth * 0.58
      ctx.stroke()
    }
  }

  private drawAfterimage(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, progress: number, intensity: number, color: string) {
    const fade = 1 - progress
    for (let i = 0; i < 6; i += 1) {
      const offset = (i - 2.5) * scale * 0.045 * easeOutCubic(progress)
      ctx.globalAlpha = fade * (0.5 - i * 0.055)
      ctx.strokeStyle = i % 2 ? rgba(color, 0.9) : 'rgba(255,50,180,.72)'
      ctx.lineWidth = 5 * intensity
      ctx.beginPath()
      ctx.ellipse(x + offset, y, scale * 0.11, scale * 0.28, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  private drawPortal(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, elapsed: number, progress: number, intensity: number, color: string) {
    const entrance = easeOutCubic(clamp(progress / 0.18))
    const fade = progress > 0.76 ? 1 - (progress - 0.76) / 0.24 : 1
    const radius = scale * 0.22 * entrance
    ctx.globalAlpha = fade
    for (let ring = 0; ring < 5; ring += 1) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(elapsed * 0.001 * (ring % 2 ? -1 : 1) * (0.5 + ring * 0.12))
      ctx.strokeStyle = rgba(ring === 0 ? '#ffffff' : color, 0.9 - ring * 0.13)
      ctx.lineWidth = Math.max(1, (5 - ring * 0.6) * intensity)
      ctx.setLineDash(ring > 1 ? [radius * 0.09, radius * 0.05] : [])
      ctx.beginPath()
      ctx.arc(0, 0, radius * (1 - ring * 0.12), 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
    ctx.setLineDash([])
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2 + elapsed * 0.0008
      const tx = x + Math.cos(angle) * radius * 0.78
      const ty = y + Math.sin(angle) * radius * 0.78
      ctx.fillStyle = rgba(color, 0.8)
      ctx.font = `${Math.max(9, radius * 0.12)}px monospace`
      ctx.fillText(i % 3 === 0 ? '◇' : '·', tx, ty)
    }
  }

  private drawRune(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, elapsed: number, progress: number, intensity: number, color: string) {
    const radius = scale * 0.14 * easeOutCubic(clamp(progress / 0.2))
    const fade = progress > 0.72 ? 1 - (progress - 0.72) / 0.28 : 1
    ctx.globalAlpha = fade
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(elapsed * 0.0012)
    ctx.strokeStyle = rgba(color, 0.9)
    ctx.lineWidth = 3 * intensity
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2
      const px = Math.cos(angle) * radius * 0.78
      const py = Math.sin(angle) * radius * 0.78
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.rotate(-elapsed * 0.0024)
    ctx.beginPath()
    ctx.moveTo(-radius * 0.72, 0)
    ctx.lineTo(radius * 0.72, 0)
    ctx.moveTo(0, -radius * 0.72)
    ctx.lineTo(0, radius * 0.72)
    ctx.stroke()
    ctx.restore()
  }

  private drawPhoenix(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, progress: number, intensity: number, color: string) {
    const travel = easeOutCubic(progress)
    const px = x + (progress < 0.3 ? 0 : (progress - 0.3) * scale * 0.8)
    const py = y - Math.sin(progress * Math.PI) * scale * 0.2
    const wing = scale * 0.16 * (0.65 + Math.sin(progress * 26) * 0.25)
    const fade = progress > 0.78 ? 1 - (progress - 0.78) / 0.22 : 1
    ctx.globalAlpha = fade
    ctx.strokeStyle = rgba(color, 0.95)
    ctx.lineWidth = 7 * intensity
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.quadraticCurveTo(px - wing * 0.45, py - wing, px - wing * 1.25, py - wing * 0.42)
    ctx.quadraticCurveTo(px - wing * 0.55, py - wing * 0.08, px, py)
    ctx.quadraticCurveTo(px + wing * 0.55, py - wing * 0.08, px + wing * 1.25, py - wing * 0.42)
    ctx.quadraticCurveTo(px + wing * 0.45, py - wing, px, py)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.quadraticCurveTo(px - wing * 0.2, py + wing * 0.7, px - wing * 0.65, py + wing * 1.1)
    ctx.moveTo(px, py)
    ctx.quadraticCurveTo(px + wing * 0.2, py + wing * 0.7, px + wing * 0.65, py + wing * 1.1)
    ctx.stroke()
    ctx.fillStyle = rgba('#ffffff', 0.92)
    ctx.beginPath()
    ctx.arc(px, py, scale * 0.016 * intensity * (1 + travel * 0.4), 0, Math.PI * 2)
    ctx.fill()
  }

  private drawOrb(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, elapsed: number, progress: number, intensity: number, color: string) {
    const hold = progress < 0.75
    const radius = scale * 0.07 * intensity * (1 + Math.sin(elapsed * 0.01) * 0.08)
    const fade = hold ? 1 : 1 - (progress - 0.75) / 0.25
    const gradient = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.25, 0, x, y, radius)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.22, rgba(color, 0.95))
    gradient.addColorStop(0.65, rgba(color, 0.4))
    gradient.addColorStop(1, rgba(color, 0))
    ctx.globalAlpha = fade
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 4; i += 1) {
      const angle = elapsed * 0.002 * (i % 2 ? -1 : 1) + i * 1.7
      ctx.strokeStyle = rgba(color, 0.65)
      ctx.lineWidth = 2 * intensity
      ctx.beginPath()
      ctx.ellipse(x, y, radius * (1.5 + i * 0.25), radius * 0.5, angle, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  private drawFireball(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, elapsed: number, progress: number, intensity: number, color: string) {
    const grow = easeOutCubic(clamp(progress / 0.35))
    const fade = progress > 0.72 ? 1 - (progress - 0.72) / 0.28 : 1
    const radius = scale * 0.085 * grow * intensity
    ctx.globalAlpha = fade
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.7)
    gradient.addColorStop(0, '#fffbd6')
    gradient.addColorStop(0.25, '#ffcf4a')
    gradient.addColorStop(0.58, color)
    gradient.addColorStop(1, 'rgba(255,40,0,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    for (let i = 0; i <= 30; i += 1) {
      const angle = (i / 30) * Math.PI * 2
      const noisy = radius * (1 + Math.sin(angle * 7 + elapsed * 0.02) * 0.12 + Math.sin(angle * 13 - elapsed * 0.013) * 0.06)
      const px = x + Math.cos(angle) * noisy
      const py = y + Math.sin(angle) * noisy
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
  }

  private drawIce(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, progress: number, intensity: number, color: string) {
    const travel = easeOutCubic(progress)
    const fade = 1 - progress
    ctx.globalAlpha = fade
    for (let i = 0; i < 18; i += 1) {
      const angle = -Math.PI / 2 + (i / 17 - 0.5) * Math.PI * 0.9
      const length = scale * (0.08 + (i % 5) * 0.025) * travel
      const sx = x + Math.cos(angle) * length
      const sy = y + Math.sin(angle) * length
      const size = scale * 0.012 * (1 + (i % 3)) * intensity
      ctx.fillStyle = i % 3 === 0 ? rgba('#ffffff', 0.9) : rgba(color, 0.7)
      ctx.beginPath()
      ctx.moveTo(sx, sy - size)
      ctx.lineTo(sx + size * 0.65, sy + size)
      ctx.lineTo(sx - size * 0.65, sy + size * 0.55)
      ctx.closePath()
      ctx.fill()
    }
    ctx.strokeStyle = rgba(color, fade * 0.8)
    ctx.lineWidth = 5 * intensity
    ctx.beginPath()
    ctx.arc(x, y, scale * 0.28 * travel, Math.PI * 1.1, Math.PI * 1.9)
    ctx.stroke()
  }

  private drawVortex(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, elapsed: number, progress: number, intensity: number, color: string) {
    const entrance = easeOutCubic(clamp(progress / 0.22))
    const fade = progress > 0.76 ? 1 - (progress - 0.76) / 0.24 : 1
    ctx.globalAlpha = fade
    for (let arm = 0; arm < 8; arm += 1) {
      ctx.strokeStyle = rgba(arm % 3 === 0 ? '#ffffff' : color, 0.75 - arm * 0.045)
      ctx.lineWidth = (5 - arm * 0.35) * intensity
      ctx.beginPath()
      for (let i = 0; i < 40; i += 1) {
        const t = i / 39
        const radius = scale * 0.22 * t * entrance
        const angle = arm * (Math.PI * 2 / 8) + t * Math.PI * 4 + elapsed * 0.002
        const px = x + Math.cos(angle) * radius
        const py = y + Math.sin(angle) * radius * 0.45
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    }
  }

  private spawnForEffect(id: EffectId, payload: TriggerPayload) {
    const density = payload.density ?? 0.75
    const color = payload.color ?? getEffect(id).color
    const counts: Record<EffectId, number> = {
      energy_shield: 28,
      repulsor_blast: 34,
      thunder_strike: 26,
      ground_shockwave: 46,
      power_aura: 42,
      energy_slash: 30,
      ultimate_beam: 52,
      teleport_afterimage: 20,
      mystic_portal: 45,
      magic_rune: 28,
      phoenix: 58,
      telekinetic_orb: 35,
      fireball: 60,
      ice_blast: 48,
      wind_vortex: 54
    }
    const shape: Particle['shape'] = ['energy_slash', 'ultimate_beam', 'phoenix', 'wind_vortex'].includes(id)
      ? 'streak'
      : ['energy_shield', 'ice_blast', 'ground_shockwave'].includes(id) ? 'shard' : 'dot'
    this.spawnBurst(payload.anchor, color, Math.round(counts[id] * density), id === 'fireball' ? 0.2 : 0.32, shape)
  }

  private spawnBurst(anchor: { x: number; y: number }, color: string, count: number, speed: number, shape: Particle['shape']) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2
      const velocity = randomBetween(speed * 0.35, speed)
      const maxLife = randomBetween(0.45, 1.35)
      this.particles.push({
        x: anchor.x,
        y: anchor.y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: maxLife,
        maxLife,
        size: randomBetween(1.5, 5.5),
        color,
        gravity: randomBetween(-0.02, 0.08),
        drag: randomBetween(0.88, 0.97),
        shape,
        rotation: angle,
        spin: randomBetween(-4, 4)
      })
    }
  }

  private spawnAmbient(anchor: { x: number; y: number }, color: string, density: number, speed: number) {
    const count = Math.max(1, Math.round(density * 3))
    for (let i = 0; i < count; i += 1) {
      const maxLife = randomBetween(0.5, 1.1)
      this.particles.push({
        x: anchor.x + randomBetween(-0.08, 0.08),
        y: anchor.y + randomBetween(-0.12, 0.1),
        vx: randomBetween(-0.02, 0.02) * speed,
        vy: randomBetween(-0.14, -0.04) * speed,
        life: maxLife,
        maxLife,
        size: randomBetween(1.5, 4),
        color,
        gravity: -0.01,
        drag: 0.96,
        shape: 'streak',
        rotation: -Math.PI / 2,
        spin: randomBetween(-2, 2)
      })
    }
  }

  private updateAndDrawParticles(ctx: CanvasRenderingContext2D, width: number, height: number, dt: number, settings: StudioSettings) {
    const maxParticles = settings.performance === 'eco' ? 170 : settings.performance === 'balanced' ? 320 : 520
    if (this.particles.length > maxParticles) this.particles.splice(0, this.particles.length - maxParticles)

    for (const particle of this.particles) {
      particle.life -= dt
      particle.vx *= Math.pow(particle.drag, dt * 60)
      particle.vy = particle.vy * Math.pow(particle.drag, dt * 60) + particle.gravity * dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.rotation += particle.spin * dt

      const alpha = clamp(particle.life / particle.maxLife)
      const px = particle.x * width
      const py = particle.y * height
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(particle.rotation)
      ctx.fillStyle = rgba(particle.color, alpha * 0.85)
      ctx.strokeStyle = rgba(particle.color, alpha * 0.9)
      ctx.shadowColor = particle.color
      ctx.shadowBlur = settings.glow * 14
      if (particle.shape === 'dot') {
        ctx.beginPath()
        ctx.arc(0, 0, particle.size * alpha, 0, Math.PI * 2)
        ctx.fill()
      } else if (particle.shape === 'streak') {
        ctx.lineWidth = Math.max(1, particle.size * 0.65 * alpha)
        ctx.beginPath()
        ctx.moveTo(-particle.size * 4, 0)
        ctx.lineTo(particle.size * 2, 0)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.moveTo(particle.size * 2, 0)
        ctx.lineTo(-particle.size, particle.size)
        ctx.lineTo(-particle.size * 0.6, -particle.size)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }
    this.particles = this.particles.filter(particle => particle.life > 0)
  }
}
