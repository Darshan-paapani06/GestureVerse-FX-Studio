import type { EffectId } from '../types/studio'
import { assetUrl } from './assets'

export class AudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private recorderDestination: MediaStreamAudioDestinationNode | null = null
  private musicElement: HTMLAudioElement | null = null
  private musicSource: MediaElementAudioSourceNode | null = null
  private userMusicUrl: string | null = null
  private enabled = true

  async initialize() {
    if (this.context) {
      if (this.context.state === 'suspended') await this.context.resume()
      return
    }
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    this.context = new AudioContextClass()
    this.master = this.context.createGain()
    this.sfxGain = this.context.createGain()
    this.musicGain = this.context.createGain()
    this.recorderDestination = this.context.createMediaStreamDestination()

    this.sfxGain.connect(this.master)
    this.musicGain.connect(this.master)
    this.master.connect(this.context.destination)
    this.master.connect(this.recorderDestination)
    await this.setBuiltInMusic()
  }

  async setBuiltInMusic() {
    await this.setMusicSource(assetUrl('audio/ambient.wav'))
  }

  async loadUserMusic(file: File) {
    if (this.userMusicUrl) URL.revokeObjectURL(this.userMusicUrl)
    this.userMusicUrl = URL.createObjectURL(file)
    await this.setMusicSource(this.userMusicUrl)
  }

  private async setMusicSource(src: string) {
    if (!this.context || !this.musicGain) return
    if (this.musicElement) this.musicElement.pause()
    if (this.musicSource) this.musicSource.disconnect()

    const element = new Audio(src)
    element.loop = true
    element.preload = 'auto'
    element.crossOrigin = 'anonymous'
    this.musicElement = element
    this.musicSource = this.context.createMediaElementSource(element)
    this.musicSource.connect(this.musicGain)
    if (this.enabled) {
      try { await element.play() } catch { /* Autoplay resumes after the next user interaction. */ }
    }
  }

  async setMusicEnabled(enabled: boolean) {
    this.enabled = enabled
    await this.initialize()
    if (!this.musicElement) return
    if (enabled) {
      try { await this.musicElement.play() } catch { /* Browser may require another direct user gesture. */ }
    } else {
      this.musicElement.pause()
    }
  }

  setVolumes(music: number, sfx: number) {
    if (this.musicGain) this.musicGain.gain.value = Math.max(0, Math.min(1, music))
    if (this.sfxGain) this.sfxGain.gain.value = Math.max(0, Math.min(1, sfx))
  }

  getRecordingTrack() {
    return this.recorderDestination?.stream.getAudioTracks()[0] ?? null
  }

  async playEffect(id: EffectId, strength = 0.8) {
    await this.initialize()
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    const recipes: Record<EffectId, { start: number; end: number; duration: number; type: OscillatorType; noise?: boolean }> = {
      energy_shield: { start: 180, end: 430, duration: 0.55, type: 'sine' },
      repulsor_blast: { start: 720, end: 110, duration: 0.28, type: 'sawtooth', noise: true },
      thunder_strike: { start: 90, end: 45, duration: 0.7, type: 'square', noise: true },
      ground_shockwave: { start: 130, end: 34, duration: 0.75, type: 'sine', noise: true },
      power_aura: { start: 110, end: 520, duration: 1.0, type: 'sawtooth' },
      energy_slash: { start: 980, end: 210, duration: 0.24, type: 'sawtooth', noise: true },
      ultimate_beam: { start: 160, end: 780, duration: 1.2, type: 'square' },
      teleport_afterimage: { start: 640, end: 90, duration: 0.42, type: 'triangle' },
      mystic_portal: { start: 130, end: 280, duration: 1.3, type: 'sine' },
      magic_rune: { start: 330, end: 660, duration: 0.75, type: 'sine' },
      phoenix: { start: 250, end: 780, duration: 0.9, type: 'sawtooth', noise: true },
      telekinetic_orb: { start: 190, end: 450, duration: 0.8, type: 'sine' },
      fireball: { start: 160, end: 80, duration: 0.8, type: 'sawtooth', noise: true },
      ice_blast: { start: 1100, end: 320, duration: 0.48, type: 'triangle', noise: true },
      wind_vortex: { start: 420, end: 120, duration: 1.0, type: 'sine', noise: true }
    }
    const recipe = recipes[id]
    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.015, strength * 0.23), now + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + recipe.duration)
    gain.connect(this.sfxGain)

    const oscillator = this.context.createOscillator()
    oscillator.type = recipe.type
    oscillator.frequency.setValueAtTime(recipe.start, now)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, recipe.end), now + recipe.duration)
    oscillator.connect(gain)
    oscillator.start(now)
    oscillator.stop(now + recipe.duration)

    if (recipe.noise) this.playNoise(now, recipe.duration, strength * 0.7)
  }

  private playNoise(now: number, duration: number, strength: number) {
    if (!this.context || !this.sfxGain) return
    const buffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * duration), this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index += 1) {
      const envelope = 1 - index / data.length
      data[index] = (Math.random() * 2 - 1) * envelope
    }
    const source = this.context.createBufferSource()
    source.buffer = buffer
    const filter = this.context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 780
    filter.Q.value = 0.65
    const gain = this.context.createGain()
    gain.gain.setValueAtTime(Math.max(0.005, strength * 0.12), now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    source.start(now)
  }
}
