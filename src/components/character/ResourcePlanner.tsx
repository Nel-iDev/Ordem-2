import { Minus, Plus } from 'lucide-react'
import type { Character } from '../../types'
import {
  clampResourcePoints,
  levelResourcePoints,
  resourceBase,
  resourcePointsRemaining,
  suggestResources,
  syncResourceTotals,
} from '../../lib/character'

interface ResourcePlannerProps {
  character: Character
  onChange: (patch: Partial<Character>) => void
  compact?: boolean
}

export function ResourcePlanner({ character, onChange, compact = false }: ResourcePlannerProps) {
  const base = resourceBase(character)
  const suggested = suggestResources(character)
  const budget = levelResourcePoints(character.level)
  const remaining = resourcePointsRemaining(character)

  const apply = (patch: Partial<Pick<Character, 'level' | 'resourcePoints'>>) => {
    const level = patch.level ?? character.level
    const resourcePoints = clampResourcePoints(
      patch.resourcePoints ?? character.resourcePoints,
      level,
    )
    const next = syncResourceTotals({ ...character, level, resourcePoints })
    onChange({
      level: next.level,
      resourcePoints: next.resourcePoints,
      pv: next.pv,
      pd: next.pd,
    })
  }

  const allocate = (resource: 'pv' | 'pd', delta: number) => {
    const current = character.resourcePoints[resource]
    if (delta > 0 && remaining <= 0) return
    apply({
      resourcePoints: {
        ...character.resourcePoints,
        [resource]: Math.max(0, current + delta),
      },
    })
  }

  return (
    <section className={`resource-planner${compact ? ' compact' : ''}`}>
      <div className="resource-planner-head">
        <div>
          <span className="field-label">Distribuição de recursos</span>
          <p className="small muted">
            PV soma a face máxima do Físico; PD soma a face máxima da Emoção.
          </p>
        </div>
        <label className="level-field">
          <span>Nível</span>
          <input
            className="input"
            type="number"
            min={1}
            value={character.level}
            onChange={(event) =>
              apply({ level: Math.max(1, Number(event.target.value) || 1) })
            }
            aria-label="Nível do personagem"
          />
        </label>
      </div>

      <div className="resource-alloc-grid">
        <article className="resource-alloc resource-alloc-pv">
          <header>
            <span>Pontos de Vida</span>
            <strong>{suggested.pvMax}</strong>
          </header>
          <p className="resource-alloc-formula">
            Base {base.pv} <span>+</span> {character.resourcePoints.pv} pts
          </p>
          <div className="resource-alloc-controls">
            <button
              type="button"
              onClick={() => allocate('pv', -1)}
              disabled={character.resourcePoints.pv <= 0}
              aria-label="Devolver 1 ponto de PV"
            >
              <Minus size={14} aria-hidden="true" />
            </button>
            <span>{character.resourcePoints.pv}</span>
            <button
              type="button"
              onClick={() => allocate('pv', 1)}
              disabled={remaining <= 0}
              aria-label="Adicionar 1 ponto de PV"
            >
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>
        </article>

        <article className="resource-alloc resource-alloc-pd">
          <header>
            <span>Pontos de Determinação</span>
            <strong>{suggested.pdMax}</strong>
          </header>
          <p className="resource-alloc-formula">
            Base {base.pd} <span>+</span> {character.resourcePoints.pd} pts
          </p>
          <div className="resource-alloc-controls">
            <button
              type="button"
              onClick={() => allocate('pd', -1)}
              disabled={character.resourcePoints.pd <= 0}
              aria-label="Devolver 1 ponto de PD"
            >
              <Minus size={14} aria-hidden="true" />
            </button>
            <span>{character.resourcePoints.pd}</span>
            <button
              type="button"
              onClick={() => allocate('pd', 1)}
              disabled={remaining <= 0}
              aria-label="Adicionar 1 ponto de PD"
            >
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>
        </article>
      </div>

      <footer className="resource-planner-foot">
        <span>
          <strong>{remaining}</strong> de <strong>{budget}</strong> ponto(s) de nível disponíveis
        </span>
        <span className="small muted">+6 pontos por nível após o 1º</span>
      </footer>
    </section>
  )
}
