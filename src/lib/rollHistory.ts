import type { RollRecord } from '../types'

export type RollHistoryFilter = 'all' | 'success' | 'failure' | 'critical'

export const ROLL_HISTORY_FILTERS: Array<{ id: RollHistoryFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'success', label: 'Sucessos' },
  { id: 'failure', label: 'Falhas' },
  { id: 'critical', label: 'Críticas' },
]

const VALID_FILTERS = new Set<RollHistoryFilter>(['all', 'success', 'failure', 'critical'])

export function isRollHistoryFilter(value: unknown): value is RollHistoryFilter {
  return typeof value === 'string' && VALID_FILTERS.has(value as RollHistoryFilter)
}

export function matchesRollHistoryFilter(
  roll: RollRecord,
  filter: RollHistoryFilter,
): boolean {
  if (filter === 'success') return roll.success
  if (filter === 'failure') return !roll.success
  if (filter === 'critical') return roll.critical || roll.criticalFailure
  return true
}
