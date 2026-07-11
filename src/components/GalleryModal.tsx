import { Download, Image, Trash2, Video, X } from 'lucide-react'
import { downloadBlob } from '../recording/StudioRecorder'

export type CaptureItem = {
  id: string
  kind: 'video' | 'image'
  blob: Blob
  url: string
  extension: string
  createdAt: Date
}

export function GalleryModal({ items, onClose, onDelete }: { items: CaptureItem[]; onClose: () => void; onDelete: (id: string) => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={event => event.currentTarget === event.target && onClose()}>
      <section className="gallery-modal">
        <header><div><span>LOCAL CAPTURE VAULT</span><h2>Recordings & screenshots</h2></div><button onClick={onClose}><X size={20} /></button></header>
        {items.length === 0 ? (
          <div className="empty-gallery"><Image size={34} /><strong>No captures yet</strong><span>Record a power sequence or take a screenshot from the studio.</span></div>
        ) : (
          <div className="gallery-grid">
            {items.map(item => (
              <article key={item.id} className="capture-card">
                <div className="capture-preview">
                  {item.kind === 'video' ? <video src={item.url} controls playsInline /> : <img src={item.url} alt="GestureVerse screenshot" />}
                  <span>{item.kind === 'video' ? <Video size={13} /> : <Image size={13} />}{item.extension.toUpperCase()}</span>
                </div>
                <div className="capture-meta">
                  <div><strong>{item.kind === 'video' ? 'Cinematic recording' : 'Studio screenshot'}</strong><small>{item.createdAt.toLocaleString()}</small></div>
                  <div className="capture-actions">
                    <button title="Download" onClick={() => void downloadBlob(item.blob, `GestureVerse-${item.createdAt.getTime()}.${item.extension}`)}><Download size={16} /></button>
                    <button title="Delete" onClick={() => onDelete(item.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
