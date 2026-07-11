import type { Results as HandsResults } from '@mediapipe/hands'
import type { Results as PoseResults } from '@mediapipe/pose'
import type { Results as FaceResults } from '@mediapipe/face_mesh'
import type { HandData, PerformanceMode, VisionSnapshot } from '../types/studio'
import { assetUrl } from '../lib/assets'

export type VisionEngineOptions = {
  performance: PerformanceMode
  faceEnabled: boolean
  segmentationEnabled: boolean
  mirror: boolean
  onSnapshot: (snapshot: VisionSnapshot) => void
  onFps?: (fps: number) => void
  onError?: (error: Error) => void
}

type Cadence = { hands: number; pose: number; face: number }
type Solution = {
  initialize: () => Promise<void>
  close: () => Promise<void>
  send: (input: { image: HTMLVideoElement }) => Promise<void>
  setOptions: (options: Record<string, unknown>) => void
  onResults: (callback: (results: never) => void) => void
  reset: () => void
}

type SolutionConstructor = new (config: { locateFile: (file: string) => string }) => Solution

declare global {
  interface Window {
    Hands?: SolutionConstructor
    Pose?: SolutionConstructor
    FaceMesh?: SolutionConstructor
  }
}

const CADENCE: Record<PerformanceMode, Cadence> = {
  eco: { hands: 66, pose: 100, face: 250 },
  balanced: { hands: 42, pose: 66, face: 120 },
  cinematic: { hands: 30, pose: 46, face: 80 }
}

const loadedScripts = new Map<string, Promise<void>>()
function loadScript(src: string) {
  const existing = loadedScripts.get(src)
  if (existing) return existing
  const promise = new Promise<void>((resolve, reject) => {
    const already = document.querySelector<HTMLScriptElement>(`script[data-mediapipe-src="${src}"]`)
    if (already) {
      if (already.dataset.loaded === 'true') resolve()
      else {
        already.addEventListener('load', () => resolve(), { once: true })
        already.addEventListener('error', () => reject(new Error(`Could not load ${src}`)), { once: true })
      }
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.crossOrigin = 'anonymous'
    script.dataset.mediapipeSrc = src
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    }, { once: true })
    script.addEventListener('error', () => reject(new Error(`Could not load ${src}`)), { once: true })
    document.head.appendChild(script)
  })
  loadedScripts.set(src, promise)
  return promise
}

export class VisionEngine {
  private hands: Solution | null = null
  private pose: Solution | null = null
  private face: Solution | null = null
  private video: HTMLVideoElement | null = null
  private frameId = 0
  private running = false
  private options: VisionEngineOptions
  private latest: VisionSnapshot = { hands: [], pose: [], face: [], timestamp: 0 }
  private processing = { hands: false, pose: false, face: false }
  private lastSent = { hands: 0, pose: 0, face: 0 }
  private initialized = { hands: false, pose: false, face: false }
  private fpsFrames = 0
  private fpsStartedAt = performance.now()

  constructor(options: VisionEngineOptions) {
    this.options = options
  }

  private async ensureCoreSolutions() {
    if (this.hands && this.pose) return
    await Promise.all([
      loadScript(assetUrl('mediapipe/hands/hands.js')),
      loadScript(assetUrl('mediapipe/pose/pose.js'))
    ])
    if (!window.Hands || !window.Pose) throw new Error('MediaPipe hand or pose runtime did not initialize.')

    this.hands = new window.Hands({ locateFile: file => assetUrl(`mediapipe/hands/${file}`) })
    this.pose = new window.Pose({ locateFile: file => assetUrl(`mediapipe/pose/${file}`) })
    this.hands.onResults(((results: HandsResults) => this.handleHands(results)) as never)
    this.pose.onResults(((results: PoseResults) => this.handlePose(results)) as never)
    this.configureSolutions()
  }

  private async ensureFaceSolution() {
    if (this.face) return
    await loadScript(assetUrl('mediapipe/face_mesh/face_mesh.js'))
    if (!window.FaceMesh) throw new Error('MediaPipe face runtime did not initialize.')
    this.face = new window.FaceMesh({ locateFile: file => assetUrl(`mediapipe/face_mesh/${file}`) })
    this.face.onResults(((results: FaceResults) => this.handleFace(results)) as never)
    this.configureSolutions()
  }

  private configureSolutions() {
    const mode = this.options.performance
    this.hands?.setOptions({
      selfieMode: this.options.mirror,
      maxNumHands: 2,
      modelComplexity: mode === 'eco' ? 0 : 1,
      minDetectionConfidence: mode === 'eco' ? 0.58 : 0.65,
      minTrackingConfidence: 0.55
    })
    this.pose?.setOptions({
      selfieMode: this.options.mirror,
      modelComplexity: mode === 'cinematic' ? 1 : 0,
      smoothLandmarks: true,
      enableSegmentation: this.options.segmentationEnabled,
      smoothSegmentation: true,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55
    })
    this.face?.setOptions({
      selfieMode: this.options.mirror,
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55
    })
  }

  async initialize() {
    await this.ensureCoreSolutions()
    await Promise.all([
      this.hands!.initialize().then(() => { this.initialized.hands = true }),
      this.pose!.initialize().then(() => { this.initialized.pose = true })
    ])
    if (this.options.faceEnabled && this.options.performance !== 'eco') {
      await this.ensureFaceSolution()
      await this.face!.initialize()
      this.initialized.face = true
    }
  }

  async start(video: HTMLVideoElement) {
    this.video = video
    if (!this.initialized.hands || !this.initialized.pose) await this.initialize()
    this.running = true
    this.fpsStartedAt = performance.now()
    this.fpsFrames = 0
    this.loop()
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.frameId)
  }

  async close() {
    this.stop()
    await Promise.allSettled([
      this.hands?.close() ?? Promise.resolve(),
      this.pose?.close() ?? Promise.resolve(),
      this.face?.close() ?? Promise.resolve()
    ])
    this.hands = null
    this.pose = null
    this.face = null
    this.initialized = { hands: false, pose: false, face: false }
  }

  async updateOptions(next: Partial<Omit<VisionEngineOptions, 'onSnapshot' | 'onFps' | 'onError'>>) {
    const faceWasEnabled = this.options.faceEnabled
    this.options = { ...this.options, ...next }
    this.configureSolutions()
    if (!faceWasEnabled && this.options.faceEnabled && this.options.performance !== 'eco' && !this.initialized.face) {
      try {
        await this.ensureFaceSolution()
        await this.face!.initialize()
        this.initialized.face = true
      } catch (error) {
        this.options.onError?.(error instanceof Error ? error : new Error(String(error)))
      }
    }
    if (this.options.performance === 'eco' || !this.options.faceEnabled) this.latest.face = []
  }

  private loop = () => {
    if (!this.running || !this.video || !this.hands || !this.pose) return
    const now = performance.now()
    const cadence = CADENCE[this.options.performance]

    if (!this.processing.hands && now - this.lastSent.hands >= cadence.hands) {
      this.processing.hands = true
      this.lastSent.hands = now
      this.hands.send({ image: this.video }).catch(error => this.report(error)).finally(() => { this.processing.hands = false })
    }

    if (!this.processing.pose && now - this.lastSent.pose >= cadence.pose) {
      this.processing.pose = true
      this.lastSent.pose = now
      this.pose.send({ image: this.video }).catch(error => this.report(error)).finally(() => { this.processing.pose = false })
    }

    if (
      this.options.faceEnabled &&
      this.options.performance !== 'eco' &&
      this.face &&
      this.initialized.face &&
      !this.processing.face &&
      now - this.lastSent.face >= cadence.face
    ) {
      this.processing.face = true
      this.lastSent.face = now
      this.face.send({ image: this.video }).catch(error => this.report(error)).finally(() => { this.processing.face = false })
    }

    this.fpsFrames += 1
    if (now - this.fpsStartedAt > 1000) {
      this.options.onFps?.(Math.round((this.fpsFrames * 1000) / (now - this.fpsStartedAt)))
      this.fpsFrames = 0
      this.fpsStartedAt = now
    }

    this.frameId = requestAnimationFrame(this.loop)
  }

  private handleHands(results: HandsResults) {
    const hands: HandData[] = (results.multiHandLandmarks ?? []).map((landmarks, index) => ({
      landmarks,
      handedness: results.multiHandedness?.[index]?.label ?? 'Right',
      score: results.multiHandedness?.[index]?.score ?? 0
    }))
    this.latest = { ...this.latest, hands, timestamp: performance.now() }
    this.emit()
  }

  private handlePose(results: PoseResults) {
    this.latest = {
      ...this.latest,
      pose: results.poseLandmarks ?? [],
      segmentationMask: this.options.segmentationEnabled ? results.segmentationMask : undefined,
      timestamp: performance.now()
    }
    this.emit()
  }

  private handleFace(results: FaceResults) {
    this.latest = {
      ...this.latest,
      face: results.multiFaceLandmarks?.[0] ?? [],
      timestamp: performance.now()
    }
    this.emit()
  }

  private emit() {
    this.options.onSnapshot(this.latest)
  }

  private report(error: unknown) {
    this.options.onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}
