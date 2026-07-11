export type Landmark = {
  x: number
  y: number
  z: number
  visibility?: number
}

export type HandData = {
  landmarks: Landmark[]
  handedness: 'Left' | 'Right'
  score: number
}

export type VisionSnapshot = {
  hands: HandData[]
  pose: Landmark[]
  face: Landmark[]
  segmentationMask?: CanvasImageSource
  timestamp: number
}

export type GestureId =
  | 'none'
  | 'swipe_left'
  | 'swipe_right'
  | 'both_fists'
  | 'crossed_hands'
  | 'palm_push'
  | 'raised_fist'
  | 'downward_punch'
  | 'hands_together_push'
  | 'double_swipe'
  | 'circle'
  | 'pinch_rotate'
  | 'arms_open'
  | 'pinch_hold'
  | 'cupped_hands'
  | 'double_open_palms'
  | 'double_circle'

export type GesturePhase = 'start' | 'hold' | 'release' | 'pulse'

export type GestureReading = {
  id: GestureId
  label: string
  confidence: number
  phase: GesturePhase
  anchor: { x: number; y: number }
  secondary?: { x: number; y: number }
  direction?: { x: number; y: number }
  charge?: number
  timestamp: number
}

export type EffectCategory = 'Superhero' | 'Anime' | 'Magic' | 'Elements'

export type EffectId =
  | 'energy_shield'
  | 'repulsor_blast'
  | 'thunder_strike'
  | 'ground_shockwave'
  | 'power_aura'
  | 'energy_slash'
  | 'ultimate_beam'
  | 'teleport_afterimage'
  | 'mystic_portal'
  | 'magic_rune'
  | 'phoenix'
  | 'telekinetic_orb'
  | 'fireball'
  | 'ice_blast'
  | 'wind_vortex'

export type EffectDefinition = {
  id: EffectId
  name: string
  category: EffectCategory
  gesture: GestureId
  gestureLabel: string
  description: string
  color: string
  duration: number
  icon: string
}

export type PerformanceMode = 'eco' | 'balanced' | 'cinematic'
export type CaptureAspect = 'landscape' | 'portrait' | 'square'
export type BackgroundMode = 'real' | 'blur' | 'upload'

export type StudioSettings = {
  performance: PerformanceMode
  mirror: boolean
  showSkeleton: boolean
  backgroundMode: BackgroundMode
  backgroundImage: string | null
  effectIntensity: number
  particleDensity: number
  glow: number
  screenShake: boolean
  musicEnabled: boolean
  musicVolume: number
  sfxVolume: number
  effectColorOverrides: Partial<Record<EffectId, string>>
  faceGlowingEyes: boolean
  faceEnergyMask: boolean
  faceCrown: boolean
  captureAspect: CaptureAspect
  gestureMappings: Partial<Record<GestureId, EffectId>>
}

export type TrackingStatus = 'idle' | 'loading' | 'ready' | 'error'

export type ActiveEffect = {
  uid: string
  id: EffectId
  startedAt: number
  duration: number
  anchor: { x: number; y: number }
  secondary?: { x: number; y: number }
  direction?: { x: number; y: number }
  color: string
  intensity: number
  holdKey?: GestureId
  releasedAt?: number
}
