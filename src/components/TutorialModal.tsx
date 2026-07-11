import { X } from 'lucide-react'
import { EFFECTS } from '../data/effects'

export function TutorialModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={event => event.currentTarget === event.target && onClose()}>
      <section className="tutorial-modal">
        <header><div><span>GESTURE TRAINING ARENA</span><h2>Power activation guide</h2></div><button onClick={onClose}><X size={20} /></button></header>
        <div className="tutorial-hero">
          <div className="tutorial-gesture crossed"><i /><i /></div>
          <div><span>CORE GESTURE 01</span><h3>Cross your hands for Energy Shield</h3><p>Keep both wrists near the chest and cross them clearly. Hold the pose to maintain the shield; separate your hands to dismiss it.</p></div>
        </div>
        <div className="tutorial-grid">
          {EFFECTS.map((effect, index) => (
            <article key={effect.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{effect.gestureLabel}</strong><small>{effect.name}</small></div></article>
          ))}
        </div>
      </section>
    </div>
  )
}
