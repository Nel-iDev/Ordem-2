import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { AttrKey, Character, Condition } from '../../types'
import { ATTR_LABEL } from '../../data/skills'
import { createId } from '../../lib/character'

interface ConditionListProps {
  character: Character
  onChange: (conditions: Condition[]) => void
}

const PRESETS: Array<{ label: string; attr: AttrKey }> = [
  { label: 'Machucado', attr: 'fisico' },
  { label: 'Desatenção', attr: 'mente' },
  { label: 'Irritação', attr: 'emocao' },
]

export function ConditionList({ character, onChange }: ConditionListProps) {
  const [label, setLabel] = useState('')
  const [attr, setAttr] = useState<AttrKey>('fisico')
  const [steps, setSteps] = useState(1)

  const add = (conditionLabel: string, conditionAttr: AttrKey, conditionSteps: number) => {
    const trimmed = conditionLabel.trim()
    if (!trimmed) return
    onChange([
      ...character.conditions,
      {
        id: createId(),
        label: trimmed,
        attr: conditionAttr,
        steps: Math.max(1, Math.min(5, conditionSteps)),
      },
    ])
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    add(label, attr, steps)
    setLabel('')
    setSteps(1)
  }

  return (
    <div>
      {character.conditions.length ? (
        <div className="condition-list">
          {character.conditions.map((condition) => (
            <div className="condition-item" key={condition.id}>
              <div className="condition-item-info">
                <strong>{condition.label}</strong>
                <small>
                  {ATTR_LABEL[condition.attr]} · −{condition.steps} passo
                  {condition.steps > 1 ? 's' : ''}
                </small>
              </div>
              <button
                type="button"
                className="icon-btn danger"
                aria-label={`Remover condição ${condition.label}`}
                onClick={() =>
                  onChange(character.conditions.filter((entry) => entry.id !== condition.id))
                }
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="small muted">Nenhuma condição ativa.</p>
      )}

      <div className="row wrap" style={{ marginTop: 12 }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="chip"
            onClick={() => add(preset.label, preset.attr, 1)}
          >
            <Plus size={12} aria-hidden="true" /> {preset.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="condition-add-row">
          <input
            className="input"
            placeholder="Condição personalizada"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            aria-label="Nome da condição"
          />
          <select
            className="select"
            value={attr}
            onChange={(event) => setAttr(event.target.value as AttrKey)}
            aria-label="Atributo afetado"
          >
            <option value="fisico">Físico</option>
            <option value="mente">Mente</option>
            <option value="emocao">Emoção</option>
          </select>
        </div>
        <div className="condition-add">
          <label className="field">
            <span>Passos</span>
            <input
              className="input"
              type="number"
              min={1}
              max={5}
              value={steps}
              onChange={(event) => setSteps(Number(event.target.value) || 1)}
            />
          </label>
          <button type="submit" className="btn btn-sm" style={{ alignSelf: 'end' }}>
            Adicionar
          </button>
        </div>
      </form>
    </div>
  )
}
