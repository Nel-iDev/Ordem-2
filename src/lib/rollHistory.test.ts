import { describe, expect, it } from 'vitest'
import type { RollRecord } from '../types'
import {
  ROLL_HISTORY_FILTERS,
  isRollHistoryFilter,
  matchesRollHistoryFilter,
} from './rollHistory'

function makeRoll(overrides: Partial<RollRecord> = {}): RollRecord {
  return {
    id: 'roll-1',
    characterId: 'char-1',
    characterName: 'Agente',
    skillName: 'Acrobacia',
    dt: 7,
    total: 8,
    ra: 5,
    rb: 3,
    critical: false,
    criticalFailure: false,
    success: true,
    dice: [],
    createdAt: 1000,
    ...overrides,
  }
}

describe('filtro do histórico de rolagens', () => {
  it('lista todos os filtros disponíveis', () => {
    expect(ROLL_HISTORY_FILTERS.map((filter) => filter.id)).toEqual([
      'all',
      'success',
      'failure',
      'critical',
    ])
  })

  it('valida apenas filtros conhecidos', () => {
    expect(isRollHistoryFilter('all')).toBe(true)
    expect(isRollHistoryFilter('critical')).toBe(true)
    expect(isRollHistoryFilter('outro')).toBe(false)
    expect(isRollHistoryFilter(null)).toBe(false)
    expect(isRollHistoryFilter(1)).toBe(false)
  })

  it('filtra sucessos e falhas', () => {
    const success = makeRoll({ success: true })
    const failure = makeRoll({ success: false })

    expect(matchesRollHistoryFilter(success, 'all')).toBe(true)
    expect(matchesRollHistoryFilter(failure, 'all')).toBe(true)
    expect(matchesRollHistoryFilter(success, 'success')).toBe(true)
    expect(matchesRollHistoryFilter(failure, 'success')).toBe(false)
    expect(matchesRollHistoryFilter(failure, 'failure')).toBe(true)
    expect(matchesRollHistoryFilter(success, 'failure')).toBe(false)
  })

  it('inclui sucesso e falha críticos no filtro de críticas', () => {
    expect(matchesRollHistoryFilter(makeRoll({ critical: true }), 'critical')).toBe(true)
    expect(
      matchesRollHistoryFilter(makeRoll({ success: false, criticalFailure: true }), 'critical'),
    ).toBe(true)
    expect(matchesRollHistoryFilter(makeRoll(), 'critical')).toBe(false)
  })
})
