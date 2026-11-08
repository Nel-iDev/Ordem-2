import type { AttrKey, Character, Die } from '../../types'
import { ATTRIBUTES, ATTR_LABEL } from '../../data/skills'
import { ATTR_BUDGET, attributeSpent, resourceBase } from '../../lib/character'
import { DieStep } from '../../components/ui/DieStep'

interface AttributesStepProps {
  character: Character
  onChangeAttr: (attr: AttrKey, die: Die) => void
}

export function AttributesStep({ character, onChangeAttr }: AttributesStepProps) {
  const spent = attributeSpent(character)
  const over = spent > ATTR_BUDGET
  const percent = Math.min(100, (spent / ATTR_BUDGET) * 100)
  const base = resourceBase(character)

  return (
    <div>
      <div className={`budget-bar${over ? ' over' : ''}`}>
        <span className="field-label">Orçamento de atributos</span>
        <strong>
          {spent} / {ATTR_BUDGET}
        </strong>
        <div className="budget-meter">
          <span style={{ width: `${percent}%` }} />
        </div>
        <span className="small muted">
          {over ? `Excedeu ${spent - ATTR_BUDGET} passo(s)` : `${ATTR_BUDGET - spent} restante(s)`}
        </span>
      </div>

      <div className="attr-editor">
        {ATTRIBUTES.map((attribute) => (
          <div className="attr-row" key={attribute.key}>
            <div className="attr-row-info">
              <strong>{ATTR_LABEL[attribute.key]}</strong>
              <p>{attribute.description}</p>
            </div>
            <DieStep
              die={character.attributes[attribute.key]}
              label={attribute.name}
              onChange={(die) => onChangeAttr(attribute.key, die)}
            />
            <span className="small muted mono" style={{ minWidth: 28, textAlign: 'right' }}>
              {character.attributes[attribute.key]}
            </span>
          </div>
        ))}
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        Cada passo custa 1 ponto: d4 = 1, d6 = 2, d8 = 3, d10 = 4, d12 = 5. O mínimo é d4.
        Físico {character.attributes.fisico} dá base de {base.pv} PV; Emoção{' '}
        {character.attributes.emocao} dá base de {base.pd} PD.
      </p>
    </div>
  )
}
