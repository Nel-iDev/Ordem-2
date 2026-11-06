import { OCCUPATIONS } from '../../data/occupations'

interface OccupationStepProps {
  selected: string
  onSelect: (id: string) => void
}

export function OccupationStep({ selected, onSelect }: OccupationStepProps) {
  return (
    <div className="option-grid">
      {OCCUPATIONS.map((occupation) => (
        <button
          key={occupation.id}
          type="button"
          className={`option-card${selected === occupation.id ? ' selected' : ''}`}
          onClick={() => onSelect(occupation.id)}
          aria-pressed={selected === occupation.id}
        >
          <span className="option-tag">
            Ocupação · +{occupation.pvBonus} PV
          </span>
          <h3>{occupation.name}</h3>
          <p>{occupation.summary}</p>
          <div
            className="review-block"
            style={{ marginTop: 4, padding: '10px 12px', background: 'var(--surface)' }}
          >
            <h3 style={{ marginBottom: 4 }}>{occupation.ability.name}</h3>
            <p style={{ fontSize: '0.78rem' }}>{occupation.ability.description}</p>
            <span className="ability-cost" style={{ marginTop: 8, display: 'inline-block' }}>
              {occupation.ability.cost}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
