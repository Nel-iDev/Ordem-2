import { useState, type FormEvent } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import type { Ability, AttrKey, Character, SkillId } from '../../types'
import { ATTRIBUTES, ATTR_LABEL, SKILLS } from '../../data/skills'
import {
  AVALIACAO_COST,
  IMPETO_ATTRIBUTE_COST,
  PRONTIDAO_COST,
  abilityStatuses,
  activateProntidao,
  clearAvaliacao,
  clearSceneEffects,
  observeTarget,
  resetProntidao,
  setAbilitySkillChoice,
  skillChoiceFor,
  spendImpetoForAttribute,
} from '../../lib/abilities'
import { createId } from '../../lib/character'

interface AbilityListProps {
  character: Character
  onAdd: (ability: Ability) => void
  onRemove: (id: string) => void
  onChange: (next: Character) => void
}

const ORIGIN_LABEL: Record<Ability['origin'], string> = {
  perfil: 'Perfil',
  ocupacao: 'Ocupação',
  nivel: 'Nível',
  custom: 'Personalizada',
}

export function AbilityList({ character, onAdd, onRemove, onChange }: AbilityListProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [cost, setCost] = useState('—')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [avaliacaoTarget, setAvaliacaoTarget] = useState(
    character.abilityState.avaliacaoTarget,
  )
  const [buffAttr, setBuffAttr] = useState<AttrKey>('fisico')

  const statuses = abilityStatuses(character)
  const statusById = new Map(statuses.map((entry) => [entry.ability.id, entry]))

  const apply = (action: () => Character) => {
    try {
      setError('')
      onChange(action())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aplicar a habilidade.')
    }
  }

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

  const renderControls = (ability: Ability) => {
    switch (ability.mechanic) {
      case 'conhecimento-tecnico':
      case 'esforco-e-suor': {
        const attr = ability.mechanic === 'conhecimento-tecnico' ? 'mente' : 'fisico'
        const choice = skillChoiceFor(character, ability)
        const options = SKILLS.filter((skill) => skill.attr === attr)

        return (
          <div className="ability-controls">
            <label className="field">
              <span>Perícia {attr === 'mente' ? 'mental' : 'física'}</span>
              <select
                className="select"
                value={choice ?? ''}
                onChange={(event) =>
                  apply(() =>
                    setAbilitySkillChoice(
                      character,
                      ability.id,
                      event.target.value as SkillId | '',
                    ),
                  )
                }
              >
                <option value="">Selecione…</option>
                {options.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="ability-hint">
              A perícia escolhida passa a usar d6 (ou mantém o dado maior) nas rolagens.
            </p>
          </div>
        )
      }

      case 'avaliacao':
        return (
          <div className="ability-controls">
            <label className="field">
              <span>Alvo observado</span>
              <input
                className="input"
                value={avaliacaoTarget}
                onChange={(event) => setAvaliacaoTarget(event.target.value)}
                placeholder="Pessoa, criatura ou ambiente"
              />
            </label>
            <div className="ability-control-row">
              <button
                type="button"
                className="btn btn-sm"
                disabled={
                  character.pd.current < AVALIACAO_COST || !avaliacaoTarget.trim()
                }
                onClick={() => {
                  setAvaliacaoTarget(avaliacaoTarget.trim())
                  apply(() => observeTarget(character, avaliacaoTarget))
                }}
              >
                Observar ({AVALIACAO_COST} PD)
              </button>
              {character.abilityState.avaliacaoCharges > 0 ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setAvaliacaoTarget('')
                    apply(() => clearAvaliacao(character))
                  }}
                >
                  Limpar cargas
                </button>
              ) : null}
            </div>
            {character.abilityState.avaliacaoCharges > 0 ? (
              <p className="ability-hint">
                {character.abilityState.avaliacaoCharges}/2 cargas. Use no diálogo de
                rolagem contra o alvo observado.
              </p>
            ) : (
              <p className="ability-hint">
                Gaste uma ação e {AVALIACAO_COST} PD para gerar duas cargas de d4.
              </p>
            )}
          </div>
        )

      case 'impeto': {
        const buff = character.abilityState.impetoAttrBuff
        return (
          <div className="ability-controls">
            {buff ? (
              <div className="ability-control-row">
                <span className="badge badge-accent">
                  {ATTR_LABEL[buff.attr]} +{buff.steps} passo
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => apply(() => clearSceneEffects(character))}
                >
                  <RotateCcw size={13} aria-hidden="true" /> Encerrar cena
                </button>
              </div>
            ) : (
              <div className="ability-control-row">
                <select
                  className="select"
                  value={buffAttr}
                  onChange={(event) => setBuffAttr(event.target.value as AttrKey)}
                  aria-label="Atributo do bônus de Ímpeto"
                >
                  {ATTRIBUTES.map((attribute) => (
                    <option key={attribute.key} value={attribute.key}>
                      {attribute.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={character.impeto.filled < IMPETO_ATTRIBUTE_COST}
                  onClick={() =>
                    apply(() => spendImpetoForAttribute(character, buffAttr))
                  }
                >
                  Gastar 3 espaços (+1 passo)
                </button>
              </div>
            )}
            <p className="ability-hint">
              O +d4 de 1 espaço é escolhido no diálogo de rolagem.
            </p>
          </div>
        )
      }

      case 'prontidao':
        return (
          <div className="ability-controls">
            <div className="ability-control-row">
              {character.abilityState.prontidaoUsed ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => apply(() => resetProntidao(character))}
                >
                  <RotateCcw size={13} aria-hidden="true" /> Novo conflito
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={character.pd.current < PRONTIDAO_COST}
                  onClick={() => apply(() => activateProntidao(character))}
                >
                  Ativar ({PRONTIDAO_COST} PD)
                </button>
              )}
            </div>
            <p className="ability-hint">
              A rodada extra é resolvida manualmente na mesa.
            </p>
          </div>
        )

      case 'mentoria':
        return (
          <p className="ability-hint">
            No diálogo de rolagem, marque “Ajudar aliado (Mentoria)” para gerar uma
            ajuda com sua rolagem alta.
          </p>
        )

      case 'foco-mental':
      case 'foco-emocional':
        return (
          <p className="ability-hint">
            Escolha o bônus no diálogo de rolagem do teste correspondente.
          </p>
        )

      default:
        return null
    }
  }

  return (
    <div>
      {error ? <p className="error-list">{error}</p> : null}

      <div className="ability-list">
        {character.abilities.length ? (
          character.abilities.map((ability) => {
            const status = statusById.get(ability.id)
            const removable = ability.origin !== 'perfil' && ability.origin !== 'ocupacao'
            return (
              <article
                className={`ability-card ability-card-${status?.tone ?? 'passive'}`}
                key={ability.id}
              >
                <div className="ability-head">
                  <div>
                    <h4>{ability.name}</h4>
                    <div className="ability-meta">
                      <span className="ability-origin">{ORIGIN_LABEL[ability.origin]}</span>
                      {status ? (
                        <span className={`ability-status ${status.tone}`}>
                          {status.label}
                        </span>
                      ) : null}
                    </div>
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
                {status ? <p className="ability-detail">{status.detail}</p> : null}
                {status?.requirement ? (
                  <p className="ability-requirement">Requisito: {status.requirement}</p>
                ) : null}
                {renderControls(ability)}
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
