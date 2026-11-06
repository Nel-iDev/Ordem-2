import type { CSSProperties } from 'react'
import type { ProfileId } from '../../types'
import { PROFILES } from '../../data/profiles'

interface ProfileStepProps {
  selected: ProfileId
  onSelect: (id: ProfileId) => void
}

export function ProfileStep({ selected, onSelect }: ProfileStepProps) {
  return (
    <div className="option-grid">
      {PROFILES.map((profile) => (
        <button
          key={profile.id}
          type="button"
          className={`option-card${selected === profile.id ? ' selected' : ''}`}
          style={{ '--option-accent': profile.accent } as CSSProperties}
          onClick={() => onSelect(profile.id)}
          aria-pressed={selected === profile.id}
        >
          <span className="option-tag">Perfil</span>
          <h3>{profile.name}</h3>
          <p>{profile.tagline}</p>
          <p>{profile.description}</p>
          <div
            className="review-block"
            style={{ marginTop: 4, padding: '10px 12px', background: 'var(--surface)' }}
          >
            <h3 style={{ marginBottom: 4 }}>{profile.ability.name}</h3>
            <p style={{ fontSize: '0.78rem' }}>{profile.ability.description}</p>
            <span className="ability-cost" style={{ marginTop: 8, display: 'inline-block' }}>
              {profile.ability.cost}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
