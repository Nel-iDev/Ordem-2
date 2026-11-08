import type { AttrKey, Character, Die } from '../../types'
import { ATTRIBUTES, ATTR_LABEL } from '../../data/skills'
import { attributeBuffSteps, effectiveAttributeDie } from '../../lib/abilities'
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
        const buff = attributeBuffSteps(character, attribute.key)
        const buffed = effectiveAttributeDie(character, attribute.key)
        const effective = stepDie(buffed, -penalty)
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
              {`base ${die}`}
              {buff > 0 ? ` · +${buff} Ímpeto` : ''}
              {penalty > 0 ? ` · −${penalty} passo${penalty > 1 ? 's' : ''}` : ''}
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
