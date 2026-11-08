import type { Character, RollRecord } from '../types'
import {
  createEmptyCharacter,
  createId,
  defaultResourcePoints,
  syncAbilities,
} from './character'
import { dieMax } from './dice'

const CHARACTER_KEY = 'arquivo2.characters.v1'
const ROLL_KEY = 'arquivo2.rolls.v1'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function clampCurrent(value: unknown, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return max
  return Math.min(max, Math.max(0, Math.floor(parsed)))
}

export function normalizeCharacter(input: Partial<Character>): Character {
  const base = createEmptyCharacter()
  const rawLevel = Number(input.level ?? base.level)
  const level = Number.isFinite(rawLevel) ? Math.max(1, Math.floor(rawLevel)) : base.level
  const attributes = { ...base.attributes, ...(input.attributes ?? {}) }
  const fallbackPoints = defaultResourcePoints(level)
  const legacyPvMax = Number(input.pv?.max)
  const legacyPdMax = Number(input.pd?.max)

  // Fichas antigas não têm `resourcePoints`. Recupera a distribuição a partir
  // do máximo salvo, descontando a base atual do atributo correspondente.
  const hasResourcePoints =
    input.resourcePoints &&
    Number.isFinite(input.resourcePoints.pv) &&
    Number.isFinite(input.resourcePoints.pd)
  const resourcePoints = hasResourcePoints
    ? {
        pv: Math.max(0, Math.floor(input.resourcePoints!.pv)),
        pd: Math.max(0, Math.floor(input.resourcePoints!.pd)),
      }
    : {
        pv: Number.isFinite(legacyPvMax)
          ? Math.max(0, Math.floor(legacyPvMax - dieMax(attributes.fisico)))
          : fallbackPoints.pv,
        pd: Number.isFinite(legacyPdMax)
          ? Math.max(0, Math.floor(legacyPdMax - dieMax(attributes.emocao)))
          : fallbackPoints.pd,
      }

  const pvMax = dieMax(attributes.fisico) + resourcePoints.pv
  const pdMax = dieMax(attributes.emocao) + resourcePoints.pd

  const merged: Character = {
    ...base,
    ...input,
    id: input.id || base.id,
    name: input.name ?? base.name,
    age: input.age ?? '',
    concept: input.concept ?? '',
    profile: input.profile ?? base.profile,
    occupationId: input.occupationId ?? base.occupationId,
    occupation: input.occupation ?? base.occupation,
    level,
    nex: Number(input.nex ?? base.nex),
    attributes,
    skills: { ...base.skills, ...(input.skills ?? {}) },
    aptitudes: { ...base.aptitudes, ...(input.aptitudes ?? {}) },
    resourcePoints,
    pv: {
      current: clampCurrent(input.pv?.current, pvMax),
      max: pvMax,
    },
    pd: {
      current: clampCurrent(input.pd?.current, pdMax),
      max: pdMax,
    },
    impeto: { ...base.impeto, ...(input.impeto ?? {}) },
    inventory: Array.isArray(input.inventory) ? input.inventory : [],
    conditions: Array.isArray(input.conditions) ? input.conditions : [],
    abilities:
      Array.isArray(input.abilities) && input.abilities.length
        ? input.abilities
        : syncAbilities({
            abilities: [],
            profile: input.profile ?? base.profile,
            occupationId: input.occupationId ?? base.occupationId,
          }),
    createdAt: Number(input.createdAt ?? Date.now()),
    updatedAt: Number(input.updatedAt ?? Date.now()),
  }
  return merged
}

export function loadCharacters(): Character[] {
  const raw = safeParse<unknown>(readStorage(CHARACTER_KEY), [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((entry): entry is Partial<Character> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => normalizeCharacter(entry))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function saveCharacters(characters: Character[]) {
  localStorage.setItem(CHARACTER_KEY, JSON.stringify(characters))
}

export function getCharacter(id: string): Character | undefined {
  return loadCharacters().find((character) => character.id === id)
}

export function upsertCharacter(character: Character) {
  const characters = loadCharacters()
  const index = characters.findIndex((entry) => entry.id === character.id)
  const next = { ...character, updatedAt: Date.now() }
  if (index >= 0) characters[index] = next
  else characters.unshift(next)
  saveCharacters(characters)
}

export function deleteCharacter(id: string) {
  saveCharacters(loadCharacters().filter((character) => character.id !== id))
}

export function duplicateCharacter(character: Character): Character {
  const copy = normalizeCharacter({
    ...character,
    id: createId(),
    name: `${character.name || 'Agente'} (cópia)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  upsertCharacter(copy)
  return copy
}

export function loadRolls(characterId?: string): RollRecord[] {
  const raw = safeParse<RollRecord[]>(readStorage(ROLL_KEY), [])
  if (!Array.isArray(raw)) return []
  const sorted = [...raw].sort((a, b) => b.createdAt - a.createdAt)
  return characterId
    ? sorted.filter((roll) => roll.characterId === characterId)
    : sorted
}

export function addRoll(roll: RollRecord) {
  const rolls = [roll, ...loadRolls()].slice(0, 200)
  localStorage.setItem(ROLL_KEY, JSON.stringify(rolls))
}

export function clearRolls(characterId: string) {
  const rolls = loadRolls().filter((roll) => roll.characterId !== characterId)
  localStorage.setItem(ROLL_KEY, JSON.stringify(rolls))
}

export function parseImportedCharacters(text: string): Character[] {
  const parsed = JSON.parse(text) as Partial<Character> | Partial<Character>[]
  const entries = (Array.isArray(parsed) ? parsed : [parsed]).filter(
    (entry): entry is Partial<Character> => Boolean(entry) && typeof entry === 'object',
  )
  if (!entries.length) {
    throw new Error('Arquivo de ficha inválido.')
  }
  return entries.map((entry) => {
    const normalized = normalizeCharacter(entry)
    if (!normalized.name) normalized.name = 'Agente importado'
    return normalized
  })
}

export function parseImportedCharacter(text: string): Character {
  const [first] = parseImportedCharacters(text)
  if (!first) throw new Error('Arquivo de ficha inválido.')
  return first
}
