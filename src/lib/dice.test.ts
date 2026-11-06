import { describe, expect, it } from 'vitest'
import type { Die } from '../types'
import {
  DIE_ORDER,
  dieCost,
  dieFaces,
  describeRoll,
  rollCriticalFailure,
  rollDie,
  rollTest,
  stepDie,
} from './dice'

/** Constrói um RNG determinístico que devolve exatamente os valores pedidos. */
function rngFor(values: Array<[Die, number]>): () => number {
  const queue = values.map(([die, value]) => (value - 0.5) / dieFaces(die))
  let index = 0
  return () => queue[index++] ?? 0
}

describe('dados', () => {
  it('mantém a escala d4 → d12 e respeita os limites', () => {
    expect(DIE_ORDER).toEqual(['d4', 'd6', 'd8', 'd10', 'd12'])
    expect(dieCost('d4')).toBe(1)
    expect(dieCost('d12')).toBe(5)
    expect(dieFaces('d10')).toBe(10)
    expect(stepDie('d4', -3)).toBe('d4')
    expect(stepDie('d12', 5)).toBe('d12')
    expect(stepDie('d12', 1, true)).toBe('d20')
    expect(stepDie('d20', -1, true)).toBe('d12')
    expect(stepDie('d20', -2, true)).toBe('d10')
  })

  it('rola um dado dentro da faixa', () => {
    expect(rollDie('d6', () => 0)).toBe(1)
    expect(rollDie('d6', () => 0.999)).toBe(6)
    expect(rollDie('d20', () => 0.5)).toBe(11)
  })

  it('soma os dados e compara com a DT', () => {
    const result = rollTest({
      attrDie: 'd8',
      skillDie: 'd6',
      dt: 7,
      rng: rngFor([
        ['d8', 5],
        ['d6', 3],
      ]),
    })

    expect(result.total).toBe(8)
    expect(result.ra).toBe(5)
    expect(result.rb).toBe(3)
    expect(result.success).toBe(true)
    expect(result.critical).toBe(false)
    expect(result.criticalFailure).toBe(false)
    expect(describeRoll(result)).toBe('Sucesso')
  })

  it('detecta sucesso crítico com valores repetidos 6+', () => {
    const result = rollTest({
      attrDie: 'd8',
      skillDie: 'd6',
      dt: 30,
      rng: rngFor([
        ['d8', 6],
        ['d6', 6],
      ]),
    })

    expect(result.critical).toBe(true)
    expect(result.success).toBe(true)
    expect(describeRoll(result)).toBe('Sucesso crítico')
  })

  it('detecta falha crítica quando todos os dados dão 1', () => {
    const result = rollTest({
      attrDie: 'd8',
      skillDie: 'd6',
      extraDice: ['d4'],
      dt: 7,
      rng: rngFor([
        ['d8', 1],
        ['d6', 1],
        ['d4', 1],
      ]),
    })

    expect(result.criticalFailure).toBe(true)
    expect(result.success).toBe(false)
    expect(describeRoll(result)).toBe('Falha crítica')
  })

  it('rola no máximo 4 dados e soma apenas os 3 maiores', () => {
    const result = rollTest({
      attrDie: 'd8',
      skillDie: 'd6',
      extraDice: ['d4', 'd4'],
      dt: 10,
      rng: rngFor([
        ['d8', 8],
        ['d6', 6],
        ['d4', 4],
        ['d4', 3],
      ]),
    })

    expect(result.dice).toHaveLength(4)
    expect(result.dice.filter((die) => die.counted)).toHaveLength(3)
    expect(result.total).toBe(18)
    expect(result.ra).toBe(8)
    expect(result.rb).toBe(4)
  })

  it('aplica passos positivos e negativos antes de rolar', () => {
    const result = rollTest({
      attrDie: 'd8',
      skillDie: 'd6',
      attrStep: -2,
      skillStep: 1,
      dt: 7,
      rng: rngFor([
        ['d4', 2],
        ['d8', 7],
      ]),
    })

    expect(result.dice[0]?.die).toBe('d4')
    expect(result.dice[1]?.die).toBe('d8')
    expect(result.total).toBe(9)
  })

  it('sorteia a consequência de falha crítica entre 1 e 8', () => {
    expect(rollCriticalFailure(() => 0)).toBe(1)
    expect(rollCriticalFailure(() => 0.999)).toBe(8)
  })
})
