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
    <div className="attr-list">
      {ATTRIBUTES.map((attribute) => {
        const die = character.attributes[attribute.key]
        const penalty = penalties[attribute.key] ?? 0
        const effective = stepDie(die, -penalty)
        return (
          <div className="attr-item" key={attribute.key} title={attribute.description}>
            <DieIcon die={effective} attr={attribute.key} size={30} />
            <div className="attr-item-info">
              <strong>{ATTR_LABEL[attribute.key]}</strong>
              <small>
                {penalty > 0
                  ? `${effective} efetivo · base ${die} (${penalty} passo${penalty > 1 ? 's' : ''} de penalidade)`
                  : attribute.description}
              </small>
            </div>
            {penalty > 0 ? <span className="attr-penalty">−{penalty}</span> : null}
            <DieStep
              die={die}
              label={attribute.name}
              onChange={(next) => onChange(attribute.key, next)}
            />
          </div>
        )
      })}
    </div>
  )
}
