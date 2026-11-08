import type {
  Character,
  CharacterCombatant,
  Combatant,
  CombatEncounter,
  CombatPhase,
  NpcCombatant,
} from '../types'
import { hasMechanic } from './abilities'
import { createId } from './character'

/**
 * Regras da mesa de combate. O módulo é puro: recebe a cena e devolve uma cena
 * nova. A ordem de iniciativa é informada pela mesa porque o material atual
 * não define uma rolagem de iniciativa.
 */

export const COMBAT_NAME = 'Novo combate'

function clampInt(value: unknown, min: number, max: number, fallback = min): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.floor(parsed)))
}

function normalizePool(
  input: unknown,
  fallbackMax = 10,
): { current: number; max: number } {
  const raw = (input ?? {}) as Partial<{ current: number; max: number }>
  const max = clampInt(raw.max, 1, 999, fallbackMax)
  const current = clampInt(raw.current, 0, max, max)
  return { current, max }
}

export function createEncounter(name = COMBAT_NAME): CombatEncounter {
  const now = Date.now()
  return {
    id: createId(),
    name: name.trim() || COMBAT_NAME,
    round: 1,
    phase: 'normal',
    currentId: null,
    prontidaoIds: [],
    active: false,
    combatants: [],
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeCombatant(input: unknown): Combatant | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Partial<Combatant> & {
    kind?: unknown
    characterId?: unknown
    name?: unknown
    pv?: unknown
    pd?: unknown
  }
  const id = typeof raw.id === 'string' && raw.id ? raw.id : createId()
  const name =
    typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : undefined
  const initiative = clampInt(raw.initiative, 0, 99, 0)
  const defeated = Boolean(raw.defeated)

  if (raw.kind === 'character') {
    if (typeof raw.characterId !== 'string' || !raw.characterId) return null
    return {
      id,
      kind: 'character',
      characterId: raw.characterId,
      name: name ?? 'Agente',
      initiative,
      defeated,
    }
  }

  if (raw.kind === 'npc') {
    return {
      id,
      kind: 'npc',
      name: name ?? 'NPC',
      initiative,
      defeated,
      pv: normalizePool(raw.pv, 10),
      pd: normalizePool(raw.pd, 10),
    }
  }

  return null
}

export function normalizeEncounter(input: Partial<CombatEncounter>): CombatEncounter {
  const base = createEncounter()
  const rawCombatants = Array.isArray(input.combatants) ? input.combatants : []
  const seen = new Set<string>()
  const combatants: Combatant[] = []

  for (const entry of rawCombatants) {
    const combatant = normalizeCombatant(entry)
    if (!combatant || seen.has(combatant.id)) continue
    seen.add(combatant.id)
    combatants.push(combatant)
  }

  const ids = new Set(combatants.map((combatant) => combatant.id))
  const prontidaoIds = Array.isArray(input.prontidaoIds)
    ? [...new Set(input.prontidaoIds.filter((id) => typeof id === 'string' && ids.has(id)))]
    : []
  const phase: CombatPhase = input.phase === 'prontidao' ? 'prontidao' : 'normal'
  const currentId =
    typeof input.currentId === 'string' && ids.has(input.currentId)
      ? input.currentId
      : null

  return {
    id: typeof input.id === 'string' && input.id ? input.id : base.id,
    name:
      typeof input.name === 'string' && input.name.trim() ? input.name.trim() : base.name,
    round: clampInt(input.round, 1, 9999, 1),
    phase,
    currentId,
    prontidaoIds,
    active: Boolean(input.active),
    combatants,
    createdAt: Number.isFinite(input.createdAt) ? Number(input.createdAt) : Date.now(),
    updatedAt: Number.isFinite(input.updatedAt) ? Number(input.updatedAt) : Date.now(),
  }
}

export function createCharacterCombatant(character: Character): CharacterCombatant {
  return {
    id: createId(),
    kind: 'character',
    characterId: character.id,
    name: character.name.trim() || 'Agente',
    initiative: 0,
    defeated: false,
  }
}

export function createNpcCombatant(input: {
  name: string
  pvMax: number
  pdMax: number
  initiative: number
}): NpcCombatant {
  const pvMax = clampInt(input.pvMax, 1, 999, 10)
  const pdMax = clampInt(input.pdMax, 1, 999, 10)
  return {
    id: createId(),
    kind: 'npc',
    name: input.name.trim() || 'NPC',
    initiative: clampInt(input.initiative, 0, 99, 0),
    defeated: false,
    pv: { current: pvMax, max: pvMax },
    pd: { current: pdMax, max: pdMax },
  }
}

export function addCombatant(
  encounter: CombatEncounter,
  combatant: Combatant,
): CombatEncounter {
  return {
    ...encounter,
    combatants: [...encounter.combatants, combatant],
    updatedAt: Date.now(),
  }
}

export function removeCombatant(
  encounter: CombatEncounter,
  combatantId: string,
): CombatEncounter {
  return {
    ...encounter,
    combatants: encounter.combatants.filter((combatant) => combatant.id !== combatantId),
    prontidaoIds: encounter.prontidaoIds.filter((id) => id !== combatantId),
    currentId: encounter.currentId === combatantId ? null : encounter.currentId,
    updatedAt: Date.now(),
  }
}

export interface CombatantPatch {
  name?: string
  initiative?: number
  defeated?: boolean
  pv?: { current?: number; max?: number }
  pd?: { current?: number; max?: number }
}

export function patchCombatant(
  encounter: CombatEncounter,
  combatantId: string,
  patch: CombatantPatch,
): CombatEncounter {
  return {
    ...encounter,
    combatants: encounter.combatants.map((combatant) => {
      if (combatant.id !== combatantId) return combatant

      const initiative =
        patch.initiative !== undefined
          ? clampInt(patch.initiative, 0, 99, combatant.initiative)
          : combatant.initiative
      const defeated =
        patch.defeated !== undefined ? patch.defeated : combatant.defeated

      if (combatant.kind === 'npc') {
        return {
          ...combatant,
          name: patch.name !== undefined ? patch.name : combatant.name,
          initiative,
          defeated,
          pv: patch.pv ? normalizePool({ ...combatant.pv, ...patch.pv }) : combatant.pv,
          pd: patch.pd ? normalizePool({ ...combatant.pd, ...patch.pd }) : combatant.pd,
        }
      }

      return {
        ...combatant,
        initiative,
        defeated,
      }
    }),
    updatedAt: Date.now(),
  }
}

export function linkedCharacter(
  combatant: Combatant,
  characters: Character[],
): Character | undefined {
  if (combatant.kind !== 'character') return undefined
  return characters.find((character) => character.id === combatant.characterId)
}

export function combatantName(
  combatant: Combatant,
  characters: Character[],
): string {
  if (combatant.kind === 'npc') return combatant.name || 'NPC'
  const character = linkedCharacter(combatant, characters)
  return character?.name.trim() || combatant.name || 'Agente'
}

export function hasActiveProntidao(
  combatant: Combatant,
  characters: Character[],
): boolean {
  const character = linkedCharacter(combatant, characters)
  return Boolean(
    character &&
      hasMechanic(character, 'prontidao') &&
      character.abilityState.prontidaoUsed,
  )
}

/**
 * Ordem de exibição e de turno. Quem ativou Prontidão vem antes de todos na
 * rodada extra; depois vale a iniciativa informada pela mesa, do maior para o
 * menor. A prioridade não se repete na rodada normal, senão o agente agiria
 * duas vezes seguidas.
 */
export function initiativeOrder(
  encounter: CombatEncounter,
  characters: Character[],
): Combatant[] {
  const prioritizeProntidao = !encounter.active || encounter.phase === 'prontidao'

  return [...encounter.combatants].sort((first, second) => {
    if (prioritizeProntidao) {
      const firstProntidao = hasActiveProntidao(first, characters) ? 1 : 0
      const secondProntidao = hasActiveProntidao(second, characters) ? 1 : 0
      if (firstProntidao !== secondProntidao) return secondProntidao - firstProntidao
    }
    if (first.initiative !== second.initiative) {
      return second.initiative - first.initiative
    }
    const byName = combatantName(first, characters).localeCompare(
      combatantName(second, characters),
      'pt-BR',
    )
    return byName !== 0 ? byName : first.id.localeCompare(second.id)
  })
}

/**
 * Inicia a cena. Personagens com Prontidão ativa entram numa rodada extra
 * antes da ordem normal, conforme a descrição da habilidade.
 */
export function startEncounter(
  encounter: CombatEncounter,
  characters: Character[],
): CombatEncounter {
  const order = initiativeOrder(encounter, characters)
  const living = order.filter((combatant) => !combatant.defeated)
  const prontidaoIds = living
    .filter((combatant) => hasActiveProntidao(combatant, characters))
    .map((combatant) => combatant.id)

  return {
    ...encounter,
    active: true,
    round: 1,
    phase: prontidaoIds.length ? 'prontidao' : 'normal',
    prontidaoIds,
    currentId: prontidaoIds[0] ?? living[0]?.id ?? null,
    updatedAt: Date.now(),
  }
}

/**
 * Avança o turno. Na fase de Prontidão, cada participante age uma vez antes de
 * a rodada 1 começar; na ordem normal, o fim da lista incrementa a rodada.
 */
export function nextTurn(
  encounter: CombatEncounter,
  characters: Character[],
): CombatEncounter {
  if (!encounter.active) return encounter

  const order = initiativeOrder(encounter, characters)
  const living = order.filter((combatant) => !combatant.defeated)

  if (!living.length) {
    return { ...encounter, currentId: null, updatedAt: Date.now() }
  }

  if (encounter.phase === 'prontidao') {
    const queue = encounter.prontidaoIds
      .map((id) => order.find((combatant) => combatant.id === id))
      .filter((combatant): combatant is Combatant => combatant !== undefined)
    const currentIndex = encounter.currentId
      ? queue.findIndex((combatant) => combatant.id === encounter.currentId)
      : -1
    const next = queue
      .slice(currentIndex + 1)
      .find((combatant) => !combatant.defeated)

    if (next) {
      return { ...encounter, currentId: next.id, updatedAt: Date.now() }
    }

    const normalOrder = initiativeOrder(
      { ...encounter, phase: 'normal' },
      characters,
    ).filter((combatant) => !combatant.defeated)

    return {
      ...encounter,
      phase: 'normal',
      round: 1,
      currentId: normalOrder[0]?.id ?? null,
      updatedAt: Date.now(),
    }
  }

  const currentIndex = encounter.currentId
    ? order.findIndex((combatant) => combatant.id === encounter.currentId)
    : -1

  if (currentIndex === -1) {
    return { ...encounter, currentId: living[0].id, updatedAt: Date.now() }
  }

  for (let index = currentIndex + 1; index < order.length; index += 1) {
    if (!order[index].defeated) {
      return { ...encounter, currentId: order[index].id, updatedAt: Date.now() }
    }
  }

  return {
    ...encounter,
    currentId: living[0].id,
    round: encounter.round + 1,
    updatedAt: Date.now(),
  }
}

export function endEncounter(encounter: CombatEncounter): CombatEncounter {
  return {
    ...encounter,
    active: false,
    phase: 'normal',
    currentId: null,
    prontidaoIds: [],
    updatedAt: Date.now(),
  }
}
