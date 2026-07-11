import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Camera, CircleHelp, Download, FolderOpen, Image, LoaderCircle, Maximize2, Radio, RotateCcw, Sparkles, Square, Video, WandSparkles } from 'lucide-react'
import { ControlsPanel } from './components/ControlsPanel'
import { EffectsPanel } from './components/EffectsPanel'
import { GalleryModal, type CaptureItem } from './components/GalleryModal'
import { Landing } from './components/Landing'
import { LogoMark } from './components/LogoMark'
import { StudioCanvas, type StudioCanvasHandle } from './components/StudioCanvas'
import { TutorialModal } from './components/TutorialModal'
import { DEFAULT_SETTINGS, getEffect } from './data/effects'
import { GestureEngine } from './gestures/GestureEngine'
import { useCamera } from './hooks/useCamera'
import { AudioEngine } from './lib/AudioEngine'
import { loadSettings, saveSettings } from './lib/storage'
import { StudioRecorder } from './recording/StudioRecorder'
import type { EffectId, GestureId, GestureReading, StudioSettings, TrackingStatus, VisionSnapshot } from './types/studio'
import { EffectEngine } from './vfx/EffectEngine'
import { VisionEngine } from './vision/VisionEngine'
import './styles/index.css'

const EMPTY_VISION: VisionSnapshot = { hands: [], pose: [], face: [], timestamp: 0 }
const NO_GESTURE: GestureReading = { id: 'none', label: 'No gesture', confidence: 0, phase: 'pulse', anchor: { x: 0.5, y: 0.5 }, timestamp: 0 }

export default function App() {
  const [started, setStarted] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('idle')
  const [settings, setSettings] = useState<StudioSettings>(() => loadSettings())
  const [selectedEffect, setSelectedEffect] = useState<EffectId>('energy_shield')
  const [gesture, setGesture] = useState<GestureReading>(NO_GESTURE)
  const [fps, setFps] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [captures, setCaptures] = useState<CaptureItem[]>([])
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const camera = useCamera()
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<StudioCanvasHandle>(null)
  const visionRef = useRef<VisionSnapshot>(EMPTY_VISION)
  const visionEngineRef = useRef<VisionEngine | null>(null)
  const gestureEngineRef = useRef(new GestureEngine())
  const effectEngineRef = useRef(new EffectEngine())
  const audioEngineRef = useRef(new AudioEngine())
  const recorderRef = useRef(new StudioRecorder())
  const settingsRef = useRef(settings)
  const lastUiGestureRef = useRef(0)
  const recordingTimerRef = useRef<number | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  settingsRef.current = settings

  const selectedDefinition = useMemo(() => getEffect(selectedEffect), [selectedEffect])
  const faceEnabled = settings.faceGlowingEyes || settings.faceEnergyMask || settings.faceCrown

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const colorFor = useCallback((id: EffectId) => settingsRef.current.effectColorOverrides[id] ?? getEffect(id).color, [])

  const processGesture = useCallback((reading: GestureReading) => {
    const now = performance.now()
    if (reading.id !== 'none' || now - lastUiGestureRef.current > 180) {
      setGesture(reading)
      lastUiGestureRef.current = now
    }
    if (reading.id === 'none') return

    const mappedEffect = settingsRef.current.gestureMappings[reading.id]
    if (!mappedEffect) return
    const current = settingsRef.current
    const payload = {
      anchor: reading.anchor,
      secondary: reading.secondary,
      direction: reading.direction,
      color: colorFor(mappedEffect),
      intensity: current.effectIntensity * (0.75 + reading.confidence * 0.35),
      density: current.particleDensity
    }

    if (reading.phase === 'start' || reading.phase === 'hold') {
      effectEngineRef.current.setHold(mappedEffect, reading.id, reading, payload.color, current.effectIntensity, current.particleDensity)
      if (reading.phase === 'start') void audioEngineRef.current.playEffect(mappedEffect, 0.5)
      return
    }

    if (reading.phase === 'release') {
      effectEngineRef.current.releaseHold(reading.id, reading.charge)
      void audioEngineRef.current.playEffect(mappedEffect, 0.75 + (reading.charge ?? 0) * 0.25)
      return
    }

    effectEngineRef.current.trigger(mappedEffect, payload)
    void audioEngineRef.current.playEffect(mappedEffect, payload.intensity)
  }, [colorFor])

  const startVision = useCallback(async (video: HTMLVideoElement) => {
    await visionEngineRef.current?.close()
    const current = settingsRef.current
    const engine = new VisionEngine({
      performance: current.performance,
      faceEnabled: current.performance !== 'eco' && (current.faceGlowingEyes || current.faceEnergyMask || current.faceCrown),
      segmentationEnabled: current.backgroundMode !== 'real',
      mirror: current.mirror,
      onSnapshot: snapshot => {
        visionRef.current = snapshot
        const reading = gestureEngineRef.current.analyze(snapshot)
        processGesture(reading)
      },
      onFps: setFps,
      onError: error => {
        console.error(error)
        setErrorMessage(error.message)
      }
    })
    visionEngineRef.current = engine
    setTrackingStatus('loading')
    await engine.start(video)
    setTrackingStatus('ready')
  }, [processGesture])

  const launchStudio = useCallback(async () => {
    setStarted(true)
    setLaunching(true)
    setErrorMessage(null)
    try {
      await audioEngineRef.current.initialize()
      audioEngineRef.current.setVolumes(settingsRef.current.musicVolume, settingsRef.current.sfxVolume)
      await audioEngineRef.current.setMusicEnabled(settingsRef.current.musicEnabled)
      const video = await camera.start(settingsRef.current ? camera.selectedDeviceId : undefined)
      await startVision(video)
    } catch (error) {
      setTrackingStatus('error')
      setErrorMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setLaunching(false)
    }
  }, [camera, startVision])

  const updateSettings = useCallback((patch: Partial<StudioSettings>) => {
    setSettings(current => ({ ...current, ...patch }))
  }, [])

  useEffect(() => {
    saveSettings(settings)
    audioEngineRef.current.setVolumes(settings.musicVolume, settings.sfxVolume)
    if (started) void audioEngineRef.current.setMusicEnabled(settings.musicEnabled)

    void visionEngineRef.current?.updateOptions({
      performance: settings.performance,
      faceEnabled: settings.performance !== 'eco' && faceEnabled,
      segmentationEnabled: settings.backgroundMode !== 'real',
      mirror: settings.mirror
    })
  }, [faceEnabled, settings, started])

  useEffect(() => () => {
    void visionEngineRef.current?.close()
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
  }, [])

  const previewEffect = useCallback((id: EffectId) => {
    const direction = id === 'energy_slash' || id === 'ultimate_beam' ? { x: 1, y: 0 } : undefined
    const anchor = id === 'ground_shockwave' ? { x: 0.5, y: 0.75 } : { x: 0.5, y: 0.48 }
    const current = settingsRef.current
    effectEngineRef.current.trigger(id, {
      anchor,
      direction,
      color: colorFor(id),
      intensity: current.effectIntensity,
      density: current.particleDensity
    })
    void audioEngineRef.current.playEffect(id, current.effectIntensity)
    setSelectedEffect(id)
  }, [colorFor])

  const changeMapping = useCallback((gestureId: GestureId, effectId: EffectId) => {
    setSettings(current => ({ ...current, gestureMappings: { ...current.gestureMappings, [gestureId]: effectId } }))
  }, [])

  const changeEffectColor = useCallback((id: EffectId, color: string) => {
    setSettings(current => ({ ...current, effectColorOverrides: { ...current.effectColorOverrides, [id]: color } }))
  }, [])

  const switchCamera = useCallback(async (deviceId: string) => {
    try {
      setTrackingStatus('loading')
      visionEngineRef.current?.stop()
      const video = await camera.switchCamera(deviceId)
      await startVision(video)
      showToast('Camera switched')
    } catch (error) {
      setTrackingStatus('error')
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }, [camera, showToast, startVision])

  const uploadBackground = useCallback((file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      showToast('Choose a background image smaller than 8 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      updateSettings({ backgroundImage: String(reader.result), backgroundMode: 'upload' })
      showToast('Background loaded locally')
    }
    reader.readAsDataURL(file)
  }, [showToast, updateSettings])

  const uploadMusic = useCallback(async (file: File) => {
    try {
      await audioEngineRef.current.loadUserMusic(file)
      updateSettings({ musicEnabled: true })
      showToast('Your music is now active')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load that audio file')
    }
  }, [showToast, updateSettings])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    effectEngineRef.current.clear()
    showToast('Studio settings reset')
  }, [showToast])

  const takeScreenshot = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setCaptures(items => [{ id: crypto.randomUUID(), kind: 'image', blob, url, extension: 'png', createdAt: new Date() }, ...items])
      showToast('Screenshot saved to local capture vault')
    }, 'image/png', 1)
  }, [showToast])

  const toggleRecording = useCallback(async () => {
    if (recording) {
      try {
        const result = await recorderRef.current.stop()
        setCaptures(items => [{ id: crypto.randomUUID(), kind: 'video', blob: result.blob, url: result.url, extension: result.extension, createdAt: new Date() }, ...items])
        showToast(`${result.extension.toUpperCase()} recording saved locally`)
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Could not stop recording')
      } finally {
        setRecording(false)
        if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      return
    }

    try {
      const canvas = canvasRef.current?.getCanvas()
      if (!canvas) throw new Error('The studio canvas is not ready.')
      if (!('MediaRecorder' in window)) throw new Error('Recording is not supported by this browser.')
      await audioEngineRef.current.initialize()
      const fpsTarget = settingsRef.current.performance === 'eco' ? 24 : 30
      recorderRef.current.start(canvas, audioEngineRef.current.getRecordingTrack(), fpsTarget)
      setRecording(true)
      setRecordingSeconds(0)
      recordingTimerRef.current = window.setInterval(() => setRecordingSeconds(seconds => seconds + 1), 1000)
      showToast('Cinematic recording started')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not start recording')
    }
  }, [recording, showToast])

  const deleteCapture = useCallback((id: string) => {
    setCaptures(items => {
      const target = items.find(item => item.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return items.filter(item => item.id !== id)
    })
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) await stageRef.current?.requestFullscreen()
    else await document.exitFullscreen()
  }, [])

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <main className="app-shell">
      <video ref={camera.videoRef} className="source-video" muted playsInline />
      {!started && <Landing onStart={launchStudio} loading={launching} />}

      {started && (
        <div className="studio-app">
          <header className="studio-topbar">
            <LogoMark />
            <div className="topbar-status">
              <span className={`tracking-pill ${trackingStatus}`}><i />{trackingStatus === 'ready' ? 'AI tracking live' : trackingStatus === 'loading' ? 'Loading vision' : trackingStatus === 'error' ? 'Vision error' : 'Standby'}</span>
              <span className="fps-chip">{fps || '--'} FPS</span>
            </div>
            <div className="topbar-actions">
              <button onClick={() => setTutorialOpen(true)} title="Gesture guide"><CircleHelp size={18} /></button>
              <button onClick={() => setGalleryOpen(true)} title="Capture vault"><FolderOpen size={18} /><em>{captures.length}</em></button>
              <button onClick={takeScreenshot} title="Screenshot"><Image size={18} /></button>
              <button onClick={toggleFullscreen} title="Fullscreen"><Maximize2 size={18} /></button>
              <button className={`record-button ${recording ? 'active' : ''}`} onClick={toggleRecording} title="Record">
                {recording ? <Square size={15} fill="currentColor" /> : <Video size={17} />}
                <span>{recording ? formatTime(recordingSeconds) : 'Record'}</span>
              </button>
            </div>
          </header>

          <div className="studio-workspace">
            <EffectsPanel
              settings={settings}
              selectedEffect={selectedEffect}
              onSelect={setSelectedEffect}
              onPreview={previewEffect}
              onMappingChange={changeMapping}
            />

            <section className="stage-column">
              <div ref={stageRef} className={`camera-stage aspect-${settings.captureAspect}`}>
                <StudioCanvas
                  ref={canvasRef}
                  video={camera.videoRef.current}
                  visionRef={visionRef}
                  settings={settings}
                  effectEngine={effectEngineRef.current}
                  cameraReady={camera.isReady}
                  activeGestureLabel={gesture.label}
                />

                {trackingStatus === 'loading' && (
                  <div className="stage-overlay loading-overlay"><LoaderCircle className="spin" size={30} /><strong>Calibrating on-device vision</strong><span>Keep your hands and upper body visible.</span></div>
                )}
                {errorMessage && trackingStatus === 'error' && (
                  <div className="stage-overlay error-overlay"><Camera size={30} /><strong>Camera or AI engine needs attention</strong><span>{errorMessage}</span><button onClick={launchStudio}><RotateCcw size={15} /> Retry</button></div>
                )}

                <div className="stage-corners" aria-hidden="true"><i /><i /><i /><i /></div>
                <button className="manual-power-button" onClick={() => previewEffect(selectedEffect)} style={{ '--effect-color': colorFor(selectedEffect) } as React.CSSProperties}>
                  <WandSparkles size={16} /><span>Activate {selectedDefinition.name}</span>
                </button>
              </div>

              <div className="telemetry-bar">
                <div className="gesture-telemetry">
                  <span className="telemetry-icon"><Radio size={16} /></span>
                  <div><small>DETECTED GESTURE</small><strong>{gesture.label}</strong></div>
                  <div className="confidence-meter"><i style={{ width: `${Math.round(gesture.confidence * 100)}%` }} /></div>
                  <output>{Math.round(gesture.confidence * 100)}%</output>
                </div>
                <div className="charge-telemetry">
                  <small>POWER CHARGE</small>
                  <div className="charge-cells">{Array.from({ length: 8 }, (_, index) => <i key={index} className={(gesture.charge ?? 0) * 8 > index ? 'active' : ''} />)}</div>
                </div>
                <div className="mode-telemetry"><Sparkles size={15} /><span>{settings.performance.toUpperCase()} MODE</span></div>
              </div>
            </section>

            <ControlsPanel
              settings={settings}
              selectedEffect={selectedEffect}
              devices={camera.devices}
              selectedDeviceId={camera.selectedDeviceId}
              onChange={updateSettings}
              onEffectColor={changeEffectColor}
              onCameraChange={switchCamera}
              onBackgroundUpload={uploadBackground}
              onMusicUpload={uploadMusic}
              onReset={resetSettings}
            />
          </div>

          <footer className="studio-footer">
            <span><i className={camera.isReady ? 'online' : ''} /> Camera {camera.isReady ? 'connected' : 'offline'}</span>
            <span>{visionRef.current.hands.length} hand{visionRef.current.hands.length === 1 ? '' : 's'} tracked</span>
            <span>Local processing</span>
            <strong>Darshan Paapani</strong>
          </footer>
        </div>
      )}

      {galleryOpen && <GalleryModal items={captures} onClose={() => setGalleryOpen(false)} onDelete={deleteCapture} />}
      {tutorialOpen && <TutorialModal onClose={() => setTutorialOpen(false)} />}
      {toast && <div className="toast"><Download size={16} />{toast}</div>}
    </main>
  )
}
