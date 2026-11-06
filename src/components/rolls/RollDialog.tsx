import { useState } from 'react'
import { Dices, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import type { Character, Condition, Die, RollRecord, RollResult, RollableSkill } from '../../types'
import { CRITICAL_FAILURES } from '../../data/rules'
import { ATTR_LABEL } from '../../data/skills'
import { createId } from '../../lib/character'
import { conditionStep } from '../../lib/character'
import { rollCriticalFailure, rollDie, rollTest, stepDie } from '../../lib/dice'
import { clamp } from '../../lib/utils'
import { addRoll } from '../../lib/storage'
import { DieIcon } from '../DieIcon'
import { Modal } from '../ui/Modal'

interface RollDialogProps {
  character: Character
  skill: RollableSkill
  onClose: () => void
  onSave: (character: Character) => void
}

interface BonusOption {
  id: 'foco' | 'impeto' | 'avaliacao'
  label: string
  description: string
  cost: string
  dice: number
  pdCost: number
  impetoCost: number
}

export function RollDialog({ character, skill, onClose, onSave }: RollDialogProps) {
  const [dt, setDt] = useState(7)
  const [useFoco, setUseFoco] = useState(false)
  const [useImpeto, setUseImpeto] = useState(false)
  const [useAvaliacao, setUseAvaliacao] = useState(false)
  const [result, setResult] = useState<RollResult | null>(null)
  const [criticalRoll, setCriticalRoll] = useState<number | null>(null)
  const [criticalApplied, setCriticalApplied] = useState(false)

  const penalty = conditionStep(character, skill.attr)
  const attrBase = character.attributes[skill.attr]
  const attrDie = stepDie(attrBase, -penalty)
  const skillDie = skill.die
  const hasMechanic = (mechanic: string) =>
    character.abilities.some((ability) => ability.mechanic === mechanic)

  const options: BonusOption[] = []
  if (hasMechanic('foco-mental') && skill.attr === 'mente') {
    options.push({
      id: 'foco',
      label: 'Foco Mental',
      description: '+d4 no teste mental',
      cost: '2 PD',
      dice: 1,
      pdCost: 2,
      impetoCost: 0,
    })
  }
  if (hasMechanic('foco-emocional') && skill.attr === 'emocao') {
    options.push({
      id: 'foco',
      label: 'Foco Emocional',
      description: '+d4 no teste emocional',
      cost: '2 PD',
      dice: 1,
      pdCost: 2,
      impetoCost: 0,
    })
  }
  if (hasMechanic('impeto')) {
    options.push({
      id: 'impeto',
      label: 'Ímpeto',
      description: '+d4 gastando 1 espaço de Ímpeto',
      cost: '1 espaço',
      dice: 1,
      pdCost: 0,
      impetoCost: 1,
    })
  }
  if (hasMechanic('avaliacao')) {
    options.push({
      id: 'avaliacao',
      label: 'Avaliação',
      description: '+2d4 contra um alvo já observado',
      cost: '2 PD',
      dice: 2,
      pdCost: 2,
      impetoCost: 0,
    })
  }

  const selected = {
    foco: useFoco,
    impeto: useImpeto,
    avaliacao: useAvaliacao,
  }

  const toggles = {
    foco: setUseFoco,
    impeto: setUseImpeto,
    avaliacao: setUseAvaliacao,
  }

  const selectedOptions = options.filter((option) => selected[option.id])
  const pdCost = selectedOptions.reduce((sum, option) => sum + option.pdCost, 0)
  const impetoCost = selectedOptions.reduce((sum, option) => sum + option.impetoCost, 0)
  const extraCount = selectedOptions.reduce((sum, option) => sum + option.dice, 0)
  const extraDice: Die[] = selectedOptions.flatMap((option) =>
    Array.from({ length: option.dice }, () => 'd4' as Die),
  )
  const canAfford = pdCost <= character.pd.current && impetoCost <= character.impeto.filled

  const doRoll = () => {
    if (!canAfford) return
    const rolled = rollTest({
      attrDie,
      skillDie,
      extraDice,
      dt,
      attrStep: 0,
      skillStep: 0,
    })

    const nextPd = clamp(character.pd.current - pdCost, 0, character.pd.max)
    const failure = !rolled.success
    const impetoAfterSpend = character.impeto.filled - impetoCost
    const impetoGain =
      failure && character.profile === 'executor'
        ? Math.min(character.impeto.max, impetoAfterSpend + 1)
        : impetoAfterSpend

    const updated: Character = {
      ...character,
      pd: { ...character.pd, current: nextPd },
      impeto: {
        ...character.impeto,
        filled: clamp(impetoGain, 0, character.impeto.max),
      },
      updatedAt: Date.now(),
    }

    const record: RollRecord = {
      id: createId(),
      characterId: character.id,
      characterName: character.name || 'Agente',
      skillName: skill.name,
      dt: rolled.dt,
      total: rolled.total,
      ra: rolled.ra,
      rb: rolled.rb,
      critical: rolled.critical,
      criticalFailure: rolled.criticalFailure,
      success: rolled.success,
      dice: rolled.dice,
      createdAt: Date.now(),
      note: selectedOptions.length
        ? selectedOptions.map((option) => option.label).join(', ')
        : undefined,
    }

    try {
      addRoll(record)
    } catch {
      // O histórico é opcional; a rolagem ainda deve ser exibida.
    }
    onSave(updated)
    setResult(rolled)
    setCriticalRoll(null)
    setCriticalApplied(false)
  }

  const reset = () => {
    setResult(null)
    setCriticalRoll(null)
    setCriticalApplied(false)
  }

  const criticalEntry =
    criticalRoll !== null
      ? CRITICAL_FAILURES.find((entry) => entry.roll === criticalRoll)
      : undefined

  const applyCritical = () => {
    if (criticalRoll === null || criticalApplied) return
    let next: Character = { ...character, updatedAt: Date.now() }

    if (criticalRoll === 2 || criticalRoll === 3 || criticalRoll === 4) {
      const attr = criticalRoll === 2 ? 'fisico' : criticalRoll === 3 ? 'mente' : 'emocao'
      const label = criticalRoll === 2 ? 'Machucado' : criticalRoll === 3 ? 'Desatenção' : 'Irritação'
      const condition: Condition = {
        id: createId(),
        label,
        attr,
        steps: 1,
      }
      next = { ...next, conditions: [...next.conditions, condition] }
    }

    if (criticalRoll === 5) {
      const damage = rollDie('d4')
      next = {
        ...next,
        pv: { ...next.pv, current: clamp(next.pv.current - damage, 0, next.pv.max) },
      }
    }

    if (criticalRoll === 6) {
      const damage = rollDie('d4')
      next = {
        ...next,
        pd: { ...next.pd, current: clamp(next.pd.current - damage, 0, next.pd.max) },
      }
    }

    onSave(next)
    setCriticalApplied(true)
  }

  const verdictClass = result?.critical
    ? 'crit'
    : result?.success
      ? 'success'
      : 'fail'
  const verdictLabel = result?.critical
    ? 'Sucesso crítico'
    : result?.criticalFailure
      ? 'Falha crítica'
      : result?.success
        ? 'Sucesso'
        : 'Falha'

  return (
    <Modal
      title={`Teste de ${skill.name}`}
      description={`${ATTR_LABEL[skill.attr]} ${attrDie} + perícia ${skillDie}`}
      onClose={onClose}
      wide
      footer={
        result ? (
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Fechar
            </button>
            <button type="button" className="btn" onClick={reset}>
              <RotateCcw size={15} aria-hidden="true" /> Novo teste
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={doRoll}
              disabled={!canAfford}
            >
              <Dices size={16} aria-hidden="true" /> Rolar teste
            </button>
          </>
        )
      }
    >
      {!result ? (
        <>
          <div className="roll-summary">
            <div className="row" style={{ gap: 4 }}>
              <DieIcon die={attrDie} attr={skill.attr} size={30} />
              <span className="mono">{attrDie}</span>
              <span className="muted small">atributo</span>
            </div>
            <span className="roll-summary-plus">+</span>
            <div className="row" style={{ gap: 4 }}>
              <DieIcon die={skillDie} attr={skill.attr} size={30} />
              <span className="mono">{skillDie}</span>
              <span className="muted small">perícia</span>
            </div>
            {penalty > 0 ? (
              <span className="badge badge-danger">
                {ATTR_LABEL[skill.attr]} −{penalty} passo{penalty > 1 ? 's' : ''}
              </span>
            ) : null}
            {extraDice.length ? (
              <span className="badge badge-accent">+{extraDice.length}d4 bônus</span>
            ) : null}
            <div className="grow" />
            <label className="field" style={{ maxWidth: 110 }}>
              <span>DT</span>
              <input
                className="input"
                type="number"
                min={1}
                max={40}
                value={dt}
                onChange={(event) => setDt(clamp(Number(event.target.value) || 7, 1, 40))}
              />
            </label>
          </div>

          {options.length ? (
            <div className="roll-options">
              <span className="field-label">Bônus disponíveis</span>
              {options.map((option) => {
                const isSelected = selected[option.id]
                const wouldExceed = !isSelected && extraCount + option.dice > 2
                const cannotPay =
                  !isSelected &&
                  (option.pdCost > character.pd.current ||
                    option.impetoCost > character.impeto.filled)
                return (
                  <label
                    key={option.id}
                    className={`roll-option${isSelected ? ' selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={wouldExceed || cannotPay}
                      onChange={(event) => toggles[option.id](event.target.checked)}
                    />
                    <span className="roll-option-info">
                      <strong>
                        {option.label} <span className="muted small">· {option.dice}d4</span>
                      </strong>
                      <small>{option.description}</small>
                    </span>
                    <span className="roll-option-cost">{option.cost}</span>
                  </label>
                )
              })}
              <p className="roll-extra-note">
                Máximo de 4 dados por teste. {pdCost > 0 ? `Custo total: ${pdCost} PD.` : ''}
                {impetoCost > 0 ? ` Consome ${impetoCost} espaço de Ímpeto.` : ''}
              </p>
            </div>
          ) : (
            <p className="small muted">Nenhum bônus disponível para este teste.</p>
          )}

          {!canAfford ? (
            <p className="error-list" style={{ marginTop: 0 }}>
              Recursos insuficientes para os bônus selecionados.
            </p>
          ) : null}
        </>
      ) : (
        <>
          <div className="roll-result">
            <div className="roll-result-head">
              <div className="roll-result-total">
                {result.total}
                <small>/ DT {result.dt}</small>
              </div>
              <span className={`roll-verdict ${verdictClass}`}>{verdictLabel}</span>
            </div>

            <div className="roll-dice">
              {result.dice.map((entry, index) => (
                <div
                  key={`${entry.label}-${index}`}
                  className={`roll-die${entry.counted ? ' counted' : ''}`}
                >
                  <DieIcon die={entry.die} attr={skill.attr} size={20} />
                  <span className="roll-die-value">{entry.value}</span>
                  <span className="roll-die-label">{entry.label}</span>
                </div>
              ))}
            </div>

            <div className="roll-metadata">
              <span>
                RA <strong>{result.ra}</strong>
              </span>
              <span>
                RB <strong>{result.rb}</strong>
              </span>
              <span>
                Dados <strong>{result.dice.filter((die) => die.counted).length}</strong>
              </span>
              {penalty > 0 ? (
                <span>
                  Penalidade <strong>−{penalty}</strong>
                </span>
              ) : null}
            </div>

            {result.criticalFailure ? (
              <div className="critical-failure">
                <h4>
                  <TriangleAlert size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} />{' '}
                  Falha crítica
                </h4>
                <p>Role 1d8 na tabela de consequências e aplique o resultado.</p>
                {criticalRoll === null ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ marginTop: 10 }}
                    onClick={() => setCriticalRoll(rollCriticalFailure())}
                  >
                    <Sparkles size={14} aria-hidden="true" /> Rolar 1d8
                  </button>
                ) : (
                  <div>
                    <div className="critical-roll">
                      <strong>{criticalRoll}</strong>
                      <span>
                        {criticalEntry?.name}: {criticalEntry?.description}
                      </span>
                    </div>
                    {!criticalApplied && [2, 3, 4, 5, 6].includes(criticalRoll) ? (
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ marginTop: 10 }}
                        onClick={applyCritical}
                      >
                        Aplicar consequência
                      </button>
                    ) : (
                      <p className="small muted" style={{ marginTop: 8 }}>
                        {criticalApplied
                          ? 'Consequência aplicada.'
                          : 'Sem efeito automático — combine com o mestre.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}
    </Modal>
  )
}
