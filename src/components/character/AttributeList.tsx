import type { AttrKey, Character, Die } from '../../types'
import { ATTRIBUTES, ATTR_LABEL } from '../../data/skills'
import { stepDie } from '../../lib/dice'
import { DieIcon } from '../DieIcon'
import { DieStep } from '../ui/DieStep'

interface AttributeListProps {
  character: Character
  penalties: Record<AttrKey, number>
  onChange: (attr: AttrKey, die: Die) => void
}

export function AttributeList({ character, penalties, onChange }: AttributeListProps) {
  return (
    <div className="attr-cards">
      {ATTRIBUTES.map((attribute) => {
        const die = character.attributes[attribute.key]
        const penalty = penalties[attribute.key] ?? 0
        const effective = stepDie(die, -penalty)
        return (
          <article
            className={`attr-card attr-card-${attribute.key}`}
            key={attribute.key}
            title={attribute.description}
          >
            <span className="attr-card-label">{ATTR_LABEL[attribute.key]}</span>
            <div className="attr-card-die">
              <DieIcon die={effective} attr={attribute.key} size={34} />
              <strong>{effective}</strong>
            </div>
            <span className={`attr-card-base${penalty > 0 ? ' penalized' : ''}`}>
              {penalty > 0
                ? `base ${die} · −${penalty} passo${penalty > 1 ? 's' : ''}`
                : `base ${die}`}
            </span>
            <DieStep
              die={die}
              label={attribute.name}
              onChange={(next) => onChange(attribute.key, next)}
            />
          </article>
        )
      })}
    </div>
  )
}
