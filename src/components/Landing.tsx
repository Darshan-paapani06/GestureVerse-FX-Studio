import { Camera, Cpu, Download, Sparkles, WandSparkles } from 'lucide-react'
import { LogoMark } from './LogoMark'

export function Landing({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  return (
    <section className="landing-shell">
      <div className="landing-grid" />
      <div className="landing-orb landing-orb--one" />
      <div className="landing-orb landing-orb--two" />
      <header className="landing-nav">
        <LogoMark />
        <span className="creator-chip">Created by Darshan Paapani</span>
      </header>

      <div className="landing-content">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> AI-POWERED CINEMATIC VFX</div>
          <h1>Control the<br /><span>impossible.</span></h1>
          <p>
            Turn hand gestures and upper-body movement into real-time shields, portals, elemental blasts,
            anime auras, and cinematic recordings—directly on your device.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={onStart} disabled={loading}>
              <Camera size={19} /> {loading ? 'Initializing vision engine…' : 'Enter FX Studio'}
            </button>
            <span className="privacy-note">On-device processing · No login · Offline-ready</span>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="energy-disc energy-disc--outer" />
          <div className="energy-disc energy-disc--middle" />
          <div className="energy-disc energy-disc--inner" />
          <LogoMark compact />
          <div className="floating-tag floating-tag--one"><WandSparkles size={15} /> 15 VFX powers</div>
          <div className="floating-tag floating-tag--two"><Cpu size={15} /> Live AI tracking</div>
          <div className="floating-tag floating-tag--three"><Download size={15} /> Record & export</div>
        </div>
      </div>

      <div className="landing-features">
        <article><strong>Hands + Pose</strong><span>Hybrid geometric and temporal gesture recognition.</span></article>
        <article><strong>Four universes</strong><span>Superhero, Anime, Magic, and Elements.</span></article>
        <article><strong>Web + Android</strong><span>Shared offline-capable application architecture.</span></article>
      </div>
    </section>
  )
}
