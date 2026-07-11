import type { EffectDefinition, EffectId, GestureId, StudioSettings } from '../types/studio'

export const EFFECTS: EffectDefinition[] = [
  {
    id: 'energy_shield', name: 'Energy Shield', category: 'Superhero', gesture: 'crossed_hands',
    gestureLabel: 'Cross both hands', description: 'A body-locked holographic shield with impact ripples.', color: '#39e7ff', duration: 1200, icon: 'shield'
  },
  {
    id: 'repulsor_blast', name: 'Repulsor Blast', category: 'Superhero', gesture: 'palm_push',
    gestureLabel: 'Open-palm push', description: 'A focused palm pulse with a luminous shock trail.', color: '#42f5ff', duration: 900, icon: 'hand'
  },
  {
    id: 'thunder_strike', name: 'Thunder Strike', category: 'Superhero', gesture: 'raised_fist',
    gestureLabel: 'Raise one fist', description: 'Calls a branching lightning strike into the raised hand.', color: '#91b8ff', duration: 1300, icon: 'zap'
  },
  {
    id: 'ground_shockwave', name: 'Ground Shockwave', category: 'Superhero', gesture: 'downward_punch',
    gestureLabel: 'Punch downward', description: 'A radial floor rupture and kinetic shock ring.', color: '#ff9a45', duration: 1100, icon: 'activity'
  },
  {
    id: 'power_aura', name: 'Power Aura Charge', category: 'Anime', gesture: 'both_fists',
    gestureLabel: 'Close both fists', description: 'Charge an escalating aura, then release an ultimate pulse.', color: '#8b5dff', duration: 1500, icon: 'flame'
  },
  {
    id: 'energy_slash', name: 'Energy Slash', category: 'Anime', gesture: 'swipe_right',
    gestureLabel: 'Swipe left or right', description: 'A directional plasma blade that follows hand velocity.', color: '#37f6d2', duration: 800, icon: 'swords'
  },
  {
    id: 'ultimate_beam', name: 'Ultimate Energy Beam', category: 'Anime', gesture: 'hands_together_push',
    gestureLabel: 'Hands together, push', description: 'A two-handed beam with core, bloom, and impact flare.', color: '#5eb8ff', duration: 1500, icon: 'sparkles'
  },
  {
    id: 'teleport_afterimage', name: 'Teleport Afterimage', category: 'Anime', gesture: 'double_swipe',
    gestureLabel: 'Fast double swipe', description: 'Splits the performer into fading chromatic silhouettes.', color: '#e668ff', duration: 1000, icon: 'scan'
  },
  {
    id: 'mystic_portal', name: 'Mystic Portal', category: 'Magic', gesture: 'circle',
    gestureLabel: 'Draw a circle', description: 'A rotating rune portal with layered sparks and depth.', color: '#ff9b43', duration: 2200, icon: 'circle-dot'
  },
  {
    id: 'magic_rune', name: 'Magic Rune Circle', category: 'Magic', gesture: 'pinch_rotate',
    gestureLabel: 'Pinch and rotate', description: 'A precise arcane glyph locked to the fingertips.', color: '#c886ff', duration: 1800, icon: 'aperture'
  },
  {
    id: 'phoenix', name: 'Phoenix Energy Bird', category: 'Magic', gesture: 'arms_open',
    gestureLabel: 'Open both arms', description: 'A fiery energy bird forms and launches across the scene.', color: '#ff663d', duration: 1800, icon: 'bird'
  },
  {
    id: 'telekinetic_orb', name: 'Telekinetic Orb', category: 'Magic', gesture: 'pinch_hold',
    gestureLabel: 'Pinch and hold', description: 'A controllable levitating orb with orbital debris.', color: '#b66aff', duration: 1400, icon: 'orbit'
  },
  {
    id: 'fireball', name: 'Fireball', category: 'Elements', gesture: 'cupped_hands',
    gestureLabel: 'Cup both hands', description: 'A turbulent ember core that grows between the palms.', color: '#ff5f2f', duration: 1300, icon: 'flame-kindling'
  },
  {
    id: 'ice_blast', name: 'Ice Blast', category: 'Elements', gesture: 'double_open_palms',
    gestureLabel: 'Show two open palms', description: 'A crystalline cone with frost shards and mist.', color: '#9beaff', duration: 1100, icon: 'snowflake'
  },
  {
    id: 'wind_vortex', name: 'Wind Vortex', category: 'Elements', gesture: 'double_circle',
    gestureLabel: 'Circle both hands', description: 'A spiralling air tunnel with streaks, dust, and pressure rings.', color: '#b7fff0', duration: 1800, icon: 'wind'
  }
]

export const DEFAULT_MAPPINGS: Partial<Record<GestureId, EffectId>> = Object.fromEntries(
  EFFECTS.map(effect => [effect.gesture, effect.id])
) as Partial<Record<GestureId, EffectId>>

// Both swipe directions intentionally control the same directional effect.
DEFAULT_MAPPINGS.swipe_left = 'energy_slash'
DEFAULT_MAPPINGS.swipe_right = 'energy_slash'

export const DEFAULT_SETTINGS: StudioSettings = {
  performance: 'balanced',
  mirror: true,
  showSkeleton: false,
  backgroundMode: 'real',
  backgroundImage: null,
  effectIntensity: 0.82,
  particleDensity: 0.78,
  glow: 0.8,
  screenShake: true,
  musicEnabled: true,
  musicVolume: 0.35,
  sfxVolume: 0.75,
  effectColorOverrides: {},
  faceGlowingEyes: true,
  faceEnergyMask: true,
  faceCrown: true,
  captureAspect: 'landscape',
  gestureMappings: DEFAULT_MAPPINGS
}

export const getEffect = (id: EffectId) => EFFECTS.find(effect => effect.id === id)!
