import { Minus, Plus } from 'lucide-react'
import type { Character } from '../../types'
import { clamp } from '../../lib/utils'

interface VitalsProps {
  character: Character
  onChange: (patch: Partial<Character>) => void
}

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function Vitals({ character, onChange }: VitalsProps) {
  const setPvMax = (max: number) => {
    const safeMax = Math.max(1, max)
    onChange({
      pv: { max: safeMax, current: clamp(character.pv.current, 0, safeMax) },
    })
  }

  const setPdMax = (max: number) => {
    const safeMax = Math.max(1, max)
    onChange({
      pd: { max: safeMax, current: clamp(character.pd.current, 0, safeMax) },
    })
  }

  const pvPercent = character.pv.max > 0 ? (character.pv.current / character.pv.max) * 100 : 0
  const pdPercent = character.pd.max > 0 ? (character.pd.current / character.pd.max) * 100 : 0

  return (
    <div className="vitals">
      <div className="vital">
        <div className="vital-head">
          <span>Pontos de Vida</span>
          <span className="vital-value">
            <input
              type="number"
              min={0}
              max={character.pv.max}
              value={character.pv.current}
              aria-label="PV atual"
              onChange={(event) =>
                onChange({
                  pv: {
                    ...character.pv,
                    current: clamp(
                      parseNumber(event.target.value, character.pv.current),
                      0,
                      character.pv.max,
                    ),
                  },
                })
              }
            />
            <small>/</small>
            <input
              type="number"
              min={1}
              value={character.pv.max}
              aria-label="PV máximo"
              onChange={(event) =>
                setPvMax(parseNumber(event.target.value, character.pv.max))
              }
            />
          </span>
        </div>
        <div className="bar bar-pv" role="presentation">
          <span style={{ width: `${clamp(pvPercent, 0, 100)}%` }} />
        </div>
        <div className="vital-controls">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              onChange({
                pv: { ...character.pv, current: clamp(character.pv.current - 1, 0, character.pv.max) },
              })
            }
          >
            <Minus size={13} aria-hidden="true" /> Dano
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              onChange({
                pv: {
                  ...character.pv,
                  current: clamp(character.pv.current + 1, 0, character.pv.max),
                },
              })
            }
          >
            <Plus size={13} aria-hidden="true" /> Cura
          </button>
        </div>
      </div>

      <div className="vital">
        <div className="vital-head">
          <span>Pontos de Determinação</span>
          <span className="vital-value">
            <input
              type="number"
              min={0}
              max={character.pd.max}
              value={character.pd.current}
              aria-label="PD atual"
              onChange={(event) =>
                onChange({
                  pd: {
                    ...character.pd,
                    current: clamp(
                      parseNumber(event.target.value, character.pd.current),
                      0,
                      character.pd.max,
                    ),
                  },
                })
              }
            />
            <small>/</small>
            <input
              type="number"
              min={1}
              value={character.pd.max}
              aria-label="PD máximo"
              onChange={(event) =>
                setPdMax(parseNumber(event.target.value, character.pd.max))
              }
            />
          </span>
        </div>
        <div className="bar bar-pd" role="presentation">
          <span style={{ width: `${clamp(pdPercent, 0, 100)}%` }} />
        </div>
        <div className="vital-controls">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              onChange({
                pd: { ...character.pd, current: clamp(character.pd.current - 1, 0, character.pd.max) },
              })
            }
          >
            <Minus size={13} aria-hidden="true" /> Gasto
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              onChange({
                pd: {
                  ...character.pd,
                  current: clamp(character.pd.current + 1, 0, character.pd.max),
                },
              })
            }
          >
            <Plus size={13} aria-hidden="true" /> Recuperar
          </button>
        </div>
      </div>

      {character.profile === 'executor' ? (
        <div className="vital">
          <div className="vital-head">
            <span>Ímpeto</span>
            <span className="vital-value">
              {character.impeto.filled}
              <small>/</small>
              {character.impeto.max}
            </span>
          </div>
          <div className="impeto-spaces" role="group" aria-label="Espaços de Ímpeto">
            {Array.from({ length: character.impeto.max }, (_, index) => {
              const filled = index < character.impeto.filled
              return (
                <button
                  key={index}
                  type="button"
                  className={`impeto-space${filled ? ' filled' : ''}`}
                  aria-label={`${filled ? 'Esvaziar' : 'Preencher'} espaço ${index + 1} de Ímpeto`}
                  aria-pressed={filled}
                  onClick={() =>
                    onChange({
                      impeto: {
                        ...character.impeto,
                        filled: filled ? index : index + 1,
                      },
                    })
                  }
                />
              )
            })}
          </div>
          <p className="small muted">
            Falhas preenchem 1 espaço. Gaste 1 para +d4 ou 3 para +1 passo de atributo na cena.
          </p>
        </div>
      ) : null}
    </div>
  )
}
