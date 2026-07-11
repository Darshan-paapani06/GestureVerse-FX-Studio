import type { Landmark } from '../types/studio'

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const distance = (a: Pick<Landmark, 'x' | 'y'>, b: Pick<Landmark, 'x' | 'y'>) => Math.hypot(a.x - b.x, a.y - b.y)
export const distance3 = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
export const midpoint = (a: Pick<Landmark, 'x' | 'y'>, b: Pick<Landmark, 'x' | 'y'>) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3)
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2
export const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)
export const rgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const value = Number.parseInt(normalized, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha)})`
}

export const coverRect = (sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number) => {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return { x: (targetWidth - width) / 2, y: (targetHeight - height) / 2, width, height }
}
