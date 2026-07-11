import { useRef, useState } from 'react'
import { Camera, Eye, Gauge, ImagePlus, Music, RotateCcw, SlidersHorizontal, Sparkles, Upload } from 'lucide-react'
import { getEffect } from '../data/effects'
import type { CameraDevice } from '../hooks/useCamera'
import type { EffectId, StudioSettings } from '../types/studio'

type Props = {
  settings: StudioSettings
  selectedEffect: EffectId
  devices: CameraDevice[]
  selectedDeviceId: string
  onChange: (patch: Partial<StudioSettings>) => void
  onEffectColor: (id: EffectId, color: string) => void
  onCameraChange: (deviceId: string) => void
  onBackgroundUpload: (file: File) => void
  onMusicUpload: (file: File) => void
  onReset: () => void
}

type Tab = 'visual' | 'camera' | 'audio' | 'face'

export function ControlsPanel({
  settings,
  selectedEffect,
  devices,
  selectedDeviceId,
  onChange,
  onEffectColor,
  onCameraChange,
  onBackgroundUpload,
  onMusicUpload,
  onReset
}: Props) {
  const [tab, setTab] = useState<Tab>('visual')
  const backgroundInput = useRef<HTMLInputElement>(null)
  const musicInput = useRef<HTMLInputElement>(null)
  const effect = getEffect(selectedEffect)
  const effectColor = settings.effectColorOverrides[selectedEffect] ?? effect.color

  return (
    <aside className="panel controls-panel">
      <div className="control-tabbar">
        <button className={tab === 'visual' ? 'active' : ''} onClick={() => setTab('visual')} title="Effect controls"><SlidersHorizontal size={17} /></button>
        <button className={tab === 'camera' ? 'active' : ''} onClick={() => setTab('camera')} title="Camera and background"><Camera size={17} /></button>
        <button className={tab === 'audio' ? 'active' : ''} onClick={() => setTab('audio')} title="Audio controls"><Music size={17} /></button>
        <button className={tab === 'face' ? 'active' : ''} onClick={() => setTab('face')} title="Face effects"><Eye size={17} /></button>
      </div>

      <div className="controls-scroll">
        {tab === 'visual' && (
          <>
            <div className="selected-effect-summary" style={{ '--effect-color': effectColor } as React.CSSProperties}>
              <span><Sparkles size={18} /></span>
              <div><small>ACTIVE PRESET</small><strong>{effect.name}</strong></div>
              <input type="color" value={effectColor} onChange={event => onEffectColor(selectedEffect, event.target.value)} aria-label="Effect color" />
            </div>
            <RangeControl label="Effect intensity" value={settings.effectIntensity} onChange={value => onChange({ effectIntensity: value })} />
            <RangeControl label="Particle density" value={settings.particleDensity} onChange={value => onChange({ particleDensity: value })} />
            <RangeControl label="Glow strength" value={settings.glow} onChange={value => onChange({ glow: value })} />
            <Toggle label="Screen impact shake" checked={settings.screenShake} onChange={checked => onChange({ screenShake: checked })} />

            <ControlSection title="Performance profile" icon={<Gauge size={15} />}>
              <div className="segmented-control three">
                {(['eco', 'balanced', 'cinematic'] as const).map(mode => (
                  <button key={mode} className={settings.performance === mode ? 'active' : ''} onClick={() => onChange({ performance: mode })}>{mode}</button>
                ))}
              </div>
              <small className="control-help">
                {settings.performance === 'eco' ? 'Low particle count; face effects disabled.' : settings.performance === 'balanced' ? 'Recommended for most laptops.' : 'Maximum quality for stronger hardware.'}
              </small>
            </ControlSection>

            <ControlSection title="Capture frame" icon={<SlidersHorizontal size={15} />}>
              <div className="segmented-control three">
                {(['landscape', 'portrait', 'square'] as const).map(aspect => (
                  <button key={aspect} className={settings.captureAspect === aspect ? 'active' : ''} onClick={() => onChange({ captureAspect: aspect })}>{aspect}</button>
                ))}
              </div>
            </ControlSection>
          </>
        )}

        {tab === 'camera' && (
          <>
            <ControlSection title="Camera source" icon={<Camera size={15} />}>
              <select className="full-select" value={selectedDeviceId} onChange={event => onCameraChange(event.target.value)}>
                {devices.length ? devices.map(device => <option value={device.deviceId} key={device.deviceId}>{device.label}</option>) : <option value="">Default camera</option>}
              </select>
            </ControlSection>
            <Toggle label="Mirror live camera" checked={settings.mirror} onChange={checked => onChange({ mirror: checked })} />
            <Toggle label="Show tracking skeleton" checked={settings.showSkeleton} onChange={checked => onChange({ showSkeleton: checked })} />

            <ControlSection title="Background mode" icon={<ImagePlus size={15} />}>
              <div className="segmented-control three">
                {(['real', 'blur', 'upload'] as const).map(mode => (
                  <button key={mode} className={settings.backgroundMode === mode ? 'active' : ''} onClick={() => onChange({ backgroundMode: mode })}>{mode}</button>
                ))}
              </div>
              <button className="secondary-action full-width" onClick={() => backgroundInput.current?.click()}><Upload size={15} /> Upload backdrop</button>
              <input ref={backgroundInput} hidden type="file" accept="image/*" onChange={event => event.target.files?.[0] && onBackgroundUpload(event.target.files[0])} />
              <small className="control-help">Blur and replacement use the pose segmentation mask. Balanced or Cinematic mode gives cleaner edges.</small>
            </ControlSection>
          </>
        )}

        {tab === 'audio' && (
          <>
            <Toggle label="Ambient background music" checked={settings.musicEnabled} onChange={checked => onChange({ musicEnabled: checked })} />
            <RangeControl label="Music volume" value={settings.musicVolume} onChange={value => onChange({ musicVolume: value })} />
            <RangeControl label="Effect sound volume" value={settings.sfxVolume} onChange={value => onChange({ sfxVolume: value })} />
            <button className="secondary-action full-width" onClick={() => musicInput.current?.click()}><Music size={15} /> Upload your music</button>
            <input ref={musicInput} hidden type="file" accept="audio/*" onChange={event => event.target.files?.[0] && onMusicUpload(event.target.files[0])} />
            <small className="control-help">The bundled ambient score and generated effect sounds are original and work offline.</small>
          </>
        )}

        {tab === 'face' && (
          <>
            <div className="face-mode-banner">
              <Eye size={18} /><div><strong>Advanced face layer</strong><span>Automatically disabled in Eco mode.</span></div>
            </div>
            <Toggle label="Glowing eyes" checked={settings.faceGlowingEyes} disabled={settings.performance === 'eco'} onChange={checked => onChange({ faceGlowingEyes: checked })} />
            <Toggle label="Energy face mask" checked={settings.faceEnergyMask} disabled={settings.performance === 'eco'} onChange={checked => onChange({ faceEnergyMask: checked })} />
            <Toggle label="Head-following crown" checked={settings.faceCrown} disabled={settings.performance === 'eco'} onChange={checked => onChange({ faceCrown: checked })} />
          </>
        )}
      </div>

      <button className="reset-button" onClick={onReset}><RotateCcw size={14} /> Reset studio settings</button>
    </aside>
  )
}

function ControlSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="control-section"><h3>{icon}{title}</h3>{children}</section>
}

function RangeControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="range-control">
      <span><strong>{label}</strong><output>{Math.round(value * 100)}%</output></span>
      <input type="range" min="0" max="1" step="0.01" value={value} onChange={event => onChange(Number(event.target.value))} />
    </label>
  )
}

function Toggle({ label, checked, disabled = false, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`toggle-row ${disabled ? 'disabled' : ''}`}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
      <i />
    </label>
  )
}
