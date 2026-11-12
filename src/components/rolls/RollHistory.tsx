import { useMemo, useState } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import type { RollRecord } from '../../types'
import { clearRolls, loadRolls } from '../../lib/storage'
import { formatDate } from '../../lib/utils'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface RollHistoryProps {
  characterId: string
  reloadToken: number
  onCleared: () => void
}

type HistoryFilter = 'all' | 'success' | 'failure' | 'critical'

const FILTERS: Array<{ id: HistoryFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'success', label: 'Sucessos' },
  { id: 'failure', label: 'Falhas' },
  { id: 'critical', label: 'Críticas' },
]

function matchesFilter(roll: RollRecord, filter: HistoryFilter): boolean {
  if (filter === 'success') return roll.success
  if (filter === 'failure') return !roll.success
  if (filter === 'critical') return roll.critical || roll.criticalFailure
  return true
}

function verdictLabel(roll: RollRecord): string {
  if (roll.critical) return 'Crítico'
  if (roll.criticalFailure) return 'Falha crítica'
  if (roll.success) return 'Sucesso'
  return 'Falha'
}

function verdictClass(roll: RollRecord): string {
  if (roll.critical) return 'badge-warn'
  if (roll.criticalFailure) return 'badge-danger'
  if (roll.success) return 'badge-ok'
  return 'badge-danger'
}

export function RollHistory({ characterId, reloadToken, onCleared }: RollHistoryProps) {
  const [confirming, setConfirming] = useState(false)
  const [version, setVersion] = useState(0)
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const rolls = useMemo<RollRecord[]>(() => {
    // `reloadToken` e `version` forçam a releitura após rolagens e limpeza.
    void reloadToken
    void version
    return loadRolls(characterId)
  }, [characterId, reloadToken, version])

  const filtered = useMemo(
    () => rolls.filter((roll) => matchesFilter(roll, filter)),
    [rolls, filter],
  )

  const handleClear = () => {
    clearRolls(characterId)
    setVersion((current) => current + 1)
    setExpanded({})
    setFilter('all')
    setConfirming(false)
    onCleared()
  }

  if (!rolls.length) {
    return <p className="small muted">Nenhuma rolagem registrada ainda.</p>
  }

  return (
    <div>
      <div className="roll-history-toolbar">
        <span className="small muted" role="status">
          {filtered.length === rolls.length
            ? `${rolls.length} rolagem${rolls.length > 1 ? 's' : ''} registrada${
                rolls.length > 1 ? 's' : ''
              }`
            : `${filtered.length} de ${rolls.length} rolagens`}
        </span>
        <div className="roll-history-actions">
          <label className="roll-history-filter">
            <span className="sr-only">Filtrar rolagens por resultado</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as HistoryFilter)}
            >
              {FILTERS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => setConfirming(true)}
          >
            <Trash2 size={13} aria-hidden="true" /> Limpar
          </button>
        </div>
      </div>

      {filtered.length ? (
        <ul className="roll-history">
          {filtered.map((roll) => {
            const tone = roll.critical ? 'crit' : roll.success ? 'ok' : 'bad'
            const isOpen = Boolean(expanded[roll.id])
            const detailsId = `roll-details-${roll.id}`
            const counted = roll.dice.filter((entry) => entry.counted).length
            return (
              <li className="roll-entry" key={roll.id}>
                <button
                  type="button"
                  className="roll-entry-summary"
                  aria-expanded={isOpen}
                  aria-controls={detailsId}
                  onClick={() =>
                    setExpanded((current) => ({ ...current, [roll.id]: !current[roll.id] }))
                  }
                >
                  <span className="roll-entry-info">
                    <strong>{roll.skillName}</strong>
                    <small>
                      DT {roll.dt} · RA {roll.ra} · RB {roll.rb} · {formatDate(roll.createdAt)}
                    </small>
                  </span>
                  <span className={`roll-entry-total ${tone}`}>{roll.total}</span>
                  <span className={`badge ${verdictClass(roll)}`}>{verdictLabel(roll)}</span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`roll-entry-chevron${isOpen ? ' open' : ''}`}
                  />
                </button>

                <div className="roll-entry-details" id={detailsId} hidden={!isOpen}>
                  <ul className="roll-entry-dice" aria-label="Dados da rolagem">
                    {roll.dice.map((entry, index) => (
                      <li
                        key={`${entry.label}-${index}`}
                        className={entry.counted ? 'counted' : undefined}
                      >
                        <span className="roll-entry-die-value">{entry.value}</span>
                        <span className="roll-entry-die-meta">
                          {entry.die} · {entry.label}
                          {entry.counted ? ' · contado' : ' · descartado'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="small muted">
                    {counted} dado{counted > 1 ? 's' : ''} contado{counted > 1 ? 's' : ''}
                    {roll.note ? ` · ${roll.note}` : ''}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="small muted">
          Nenhuma rolagem corresponde ao filtro selecionado.
        </p>
      )}

      {confirming ? (
        <ConfirmDialog
          title="Limpar histórico"
          message="Todas as rolagens desta ficha serão apagadas. Deseja continuar?"
          confirmLabel="Limpar histórico"
          onCancel={() => setConfirming(false)}
          onConfirm={handleClear}
        />
      ) : null}
    </div>
  )
}
