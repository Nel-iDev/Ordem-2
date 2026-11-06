import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { RollRecord } from '../../types'
import { clearRolls, loadRolls } from '../../lib/storage'
import { formatDate } from '../../lib/utils'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface RollHistoryProps {
  characterId: string
  reloadToken: number
  onCleared: () => void
}

export function RollHistory({ characterId, reloadToken, onCleared }: RollHistoryProps) {
  const [confirming, setConfirming] = useState(false)
  const [version, setVersion] = useState(0)

  const rolls = useMemo<RollRecord[]>(() => {
    // `reloadToken` e `version` forçam a releitura após rolagens e limpeza.
    void reloadToken
    void version
    return loadRolls(characterId)
  }, [characterId, reloadToken, version])

  const handleClear = () => {
    clearRolls(characterId)
    setVersion((current) => current + 1)
    setConfirming(false)
    onCleared()
  }

  if (!rolls.length) {
    return <p className="small muted">Nenhuma rolagem registrada ainda.</p>
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <span className="small muted">
          {rolls.length} rolagem{rolls.length > 1 ? 's' : ''} registrada
          {rolls.length > 1 ? 's' : ''}
        </span>
        <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirming(true)}>
          <Trash2 size={13} aria-hidden="true" /> Limpar
        </button>
      </div>

      <div className="roll-history">
        {rolls.map((roll) => {
          const tone = roll.critical ? 'crit' : roll.success ? 'ok' : 'bad'
          return (
            <div className="roll-entry" key={roll.id}>
              <div className="roll-entry-info">
                <strong>{roll.skillName}</strong>
                <small>
                  DT {roll.dt} · RA {roll.ra} · RB {roll.rb} · {formatDate(roll.createdAt)}
                  {roll.note ? ` · ${roll.note}` : ''}
                </small>
              </div>
              <span className="roll-entry-total mono">{roll.total}</span>
              <span className={`badge ${tone === 'crit' ? 'badge-warn' : tone === 'ok' ? 'badge-ok' : 'badge-danger'}`}>
                {roll.critical ? 'Crítico' : roll.criticalFailure ? 'Falha crítica' : roll.success ? 'Sucesso' : 'Falha'}
              </span>
            </div>
          )
        })}
      </div>

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
