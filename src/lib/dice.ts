import type { Die, RollDieResult, RollResult } from '../types'

export const DIE_ORDER: Die[] = ['d4', 'd6', 'd8', 'd10', 'd12']

export function dieFaces(die: Die): number {
  return Number(die.slice(1))
}

export function dieMax(die: Die): number {
  return dieFaces(die)
}

export function dieIndex(die: Die): number {
  const index = DIE_ORDER.indexOf(die)
  return index === -1 ? 0 : index
}

export function dieCost(die: Die): number {
  return dieIndex(die) + 1
}

export function stepDie(die: Die, delta: number, allowD20 = false): Die {
  if (die === 'd20') {
    const down = stepDie('d12', delta + 1, allowD20)
    return down
  }
  const ordered = allowD20 ? [...DIE_ORDER, 'd20' as Die] : DIE_ORDER
  const index = ordered.indexOf(die)
  const next = Math.max(0, Math.min(ordered.length - 1, index + delta))
  return ordered[next] ?? 'd4'
}

export function rollDie(die: Die, rng: () => number = Math.random): number {
  return Math.floor(rng() * dieFaces(die)) + 1
}

export interface RollTestOptions {
  attrDie: Die
  skillDie: Die
  extraDice?: Die[]
  dt?: number
  attrStep?: number
  skillStep?: number
  allowD20?: boolean
  rng?: () => number
}

export function rollTest(options: RollTestOptions): RollResult {
  const {
    attrDie,
    skillDie,
    extraDice = [],
    dt = 7,
    attrStep = 0,
    skillStep = 0,
    allowD20 = false,
    rng = Math.random,
  } = options

  const attr = stepDie(attrDie, attrStep, allowD20)
  const skill = stepDie(skillDie, skillStep, allowD20)

  const base = [
    { die: attr, label: 'Atributo' },
    { die: skill, label: 'Perícia' },
  ]

  const extras = extraDice.slice(0, Math.max(0, 4 - base.length)).map((die) => ({
    die,
    label: 'Extra',
  }))

  const raw = [...base, ...extras].map((entry) => ({
    ...entry,
    value: rollDie(entry.die, rng),
    counted: false,
  }))

  return evaluateRoll(raw, dt)
}

/**
 * Recalcula um resultado a partir dos dados. Usado pela rolagem normal e por
 * efeitos que substituem um dado depois da rolagem (ex.: Mentoria).
 */
export function evaluateRoll(dice: RollDieResult[], dt: number): RollResult {
  const rankedIndices = dice
    .map((_, index) => index)
    .sort((a, b) => dice[b].value - dice[a].value)
  const countedIndices = new Set(rankedIndices.slice(0, 3))
  const nextDice = dice.map((entry, index) => ({
    ...entry,
    counted: countedIndices.has(index),
  }))

  const counted = nextDice.filter((entry) => entry.counted)
  const values = nextDice.map((entry) => entry.value)
  const total = counted.reduce((sum, entry) => sum + entry.value, 0)
  const ra = counted.length ? Math.max(...counted.map((entry) => entry.value)) : 0
  const rb = counted.length ? Math.min(...counted.map((entry) => entry.value)) : 0

  const duplicateHigh = values.some(
    (value, index) => value >= 6 && values.findIndex((other) => other === value) !== index,
  )
  const criticalFailure = values.length > 0 && values.every((value) => value === 1)
  const critical = duplicateHigh && !criticalFailure
  const success = critical || (!criticalFailure && total >= dt)

  return { dice: nextDice, total, ra, rb, critical, criticalFailure, success, dt }
}

/**
 * Mentoria: substitui o menor dado contado pelo resultado alto do aliado que
 * ajudou. O resultado é recalculado por inteiro (total, RA/RB e críticos).
 */
export function applyMentoriaHelp(result: RollResult, value: number): RollResult {
  if (!result.dice.length) return result

  const counted = result.dice.filter((entry) => entry.counted)
  const pool = counted.length ? counted : result.dice
  const target = pool.reduce((lowest, entry) => (entry.value < lowest.value ? entry : lowest))
  const dice = result.dice.map((entry) =>
    entry === target
      ? { ...entry, value, label: `${entry.label} + Mentoria` }
      : entry,
  )

  return evaluateRoll(dice, result.dt)
}

export function describeRoll(result: RollResult): string {
  if (result.critical) return 'Sucesso crítico'
  if (result.criticalFailure) return 'Falha crítica'
  if (result.success) return 'Sucesso'
  return 'Falha'
}

export function rollCriticalFailure(rng: () => number = Math.random): number {
  return Math.floor(rng() * 8) + 1
}
