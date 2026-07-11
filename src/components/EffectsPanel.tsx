import { useMemo, useState } from 'react'
import { Activity, Aperture, Bird, CircleDot, Flame, FlameKindling, Hand, Orbit, Play, Scan, Shield, Snowflake, Sparkles, Swords, Wind, Zap } from 'lucide-react'
import { EFFECTS } from '../data/effects'
import type { EffectCategory, EffectId, GestureId, StudioSettings } from '../types/studio'

const categories: EffectCategory[] = ['Superhero', 'Anime', 'Magic', 'Elements']

const icons = {
  shield: Shield,
  hand: Hand,
  zap: Zap,
  activity: Activity,
  flame: Flame,
  swords: Swords,
  sparkles: Sparkles,
  scan: Scan,
  'circle-dot': CircleDot,
  aperture: Aperture,
  bird: Bird,
  orbit: Orbit,
  'flame-kindling': FlameKindling,
  snowflake: Snowflake,
  wind: Wind
}

type Props = {
  settings: StudioSettings
  selectedEffect: EffectId
  onSelect: (id: EffectId) => void
  onPreview: (id: EffectId) => void
  onMappingChange: (gesture: GestureId, effect: EffectId) => void
}

export function EffectsPanel({ settings, selectedEffect, onSelect, onPreview, onMappingChange }: Props) {
  const [category, setCategory] = useState<EffectCategory>('Superhero')
  const [mode, setMode] = useState<'effects' | 'mapper'>('effects')
  const filtered = useMemo(() => EFFECTS.filter(effect => effect.category === category), [category])

  return (
    <aside className="panel effects-panel">
      <div className="panel-tabs">
        <button className={mode === 'effects' ? 'active' : ''} onClick={() => setMode('effects')}>Effects</button>
        <button className={mode === 'mapper' ? 'active' : ''} onClick={() => setMode('mapper')}>Gesture Mapper</button>
      </div>

      {mode === 'effects' ? (
        <>
          <div className="category-tabs">
            {categories.map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="effect-list">
            {filtered.map(effect => {
              const Icon = icons[effect.icon as keyof typeof icons] ?? Sparkles
              const color = settings.effectColorOverrides[effect.id] ?? effect.color
              return (
                <button
                  key={effect.id}
                  className={`effect-card ${selectedEffect === effect.id ? 'selected' : ''}`}
                  onClick={() => onSelect(effect.id)}
                  style={{ '--effect-color': color } as React.CSSProperties}
                >
                  <span className="effect-icon"><Icon size={20} /></span>
                  <span className="effect-copy"><strong>{effect.name}</strong><small>{effect.gestureLabel}</small></span>
                  <span className="preview-icon" onClick={event => { event.stopPropagation(); onPreview(effect.id) }} title="Preview effect"><Play size={14} fill="currentColor" /></span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="mapper-list">
          <p className="panel-intro">Assign any cinematic power to a recognized gesture. Changes are stored locally.</p>
          {EFFECTS.map(effect => (
            <label className="mapper-row" key={`${effect.gesture}-${effect.id}`}>
              <span><strong>{effect.gestureLabel}</strong><small>{effect.gesture.replaceAll('_', ' ')}</small></span>
              <select
                value={settings.gestureMappings[effect.gesture] ?? effect.id}
                onChange={event => onMappingChange(effect.gesture, event.target.value as EffectId)}
              >
                {EFFECTS.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
    </aside>
  )
}
