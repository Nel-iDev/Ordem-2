import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Ability } from '../../types'
import { createId } from '../../lib/character'

interface AbilityListProps {
  abilities: Ability[]
  onAdd: (ability: Ability) => void
  onRemove: (id: string) => void
}

const ORIGIN_LABEL: Record<Ability['origin'], string> = {
  perfil: 'Perfil',
  ocupacao: 'Ocupação',
  nivel: 'Nível',
  custom: 'Personalizada',
}

export function AbilityList({ abilities, onAdd, onRemove }: AbilityListProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [cost, setCost] = useState('—')
  const [description, setDescription] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    onAdd({
      id: `custom-${createId()}`,
      name: name.trim(),
      origin: 'custom',
      cost: cost.trim() || '—',
      description: description.trim(),
      mechanic: 'custom',
    })
    setName('')
    setCost('—')
    setDescription('')
    setAdding(false)
  }

  return (
    <div>
      <div className="ability-list">
        {abilities.length ? (
          abilities.map((ability) => {
            const removable = ability.origin !== 'perfil' && ability.origin !== 'ocupacao'
            return (
              <article className="ability-card" key={ability.id}>
                <div className="ability-head">
                  <div>
                    <h4>{ability.name}</h4>
                    <span className="ability-origin">{ORIGIN_LABEL[ability.origin]}</span>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="ability-cost">{ability.cost}</span>
                    {removable ? (
                      <button
                        type="button"
                        className="icon-btn danger"
                        aria-label={`Remover habilidade ${ability.name}`}
                        onClick={() => onRemove(ability.id)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <p>{ability.description}</p>
              </article>
            )
          })
        ) : (
          <p className="small muted">Nenhuma habilidade registrada.</p>
        )}
      </div>

      {adding ? (
        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <div className="stack-sm">
            <div className="input-row">
              <label className="field">
                <span>Nome</span>
                <input
                  className="input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Habilidade de nível"
                  required
                />
              </label>
              <label className="field">
                <span>Custo</span>
                <input
                  className="input"
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                  placeholder="2 PD, passivo..."
                />
              </label>
            </div>
            <label className="field">
              <span>Descrição</span>
              <textarea
                className="textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="O que a habilidade faz?"
                style={{ minHeight: 72 }}
              />
            </label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Salvar habilidade
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => setAdding(true)}
        >
          <Plus size={14} aria-hidden="true" /> Adicionar habilidade
        </button>
      )}
    </div>
  )
}
