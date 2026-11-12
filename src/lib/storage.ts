import type {
  Campaign,
  Character,
  CombatEncounter,
  MentoriaHelp,
  RollRecord,
} from '../types'
import { normalizeAbilityState } from './abilities'
import { normalizeCampaign } from './campaigns'
import {
  createEmptyCharacter,
  createId,
  defaultResourcePoints,
  syncAbilities,
} from './character'
import { normalizeEncounter } from './combat'
import { dieMax } from './dice'
import { isRollHistoryFilter, type RollHistoryFilter } from './rollHistory'

const CHARACTER_KEY = 'arquivo2.characters.v1'
const ROLL_KEY = 'arquivo2.rolls.v1'
const ROLL_FILTER_KEY = 'arquivo2.rollFilters.v1'
const MENTORIA_KEY = 'arquivo2.mentoria.v1'
const COMBAT_KEY = 'arquivo2.combats.v1'
const CAMPAIGN_KEY = 'arquivo2.campaigns.v1'

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
    abilityState: normalizeAbilityState(input.abilityState),
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
  clearMentoriaHelps(id)
  removeCharacterFromCampaigns(id)
  removeRollHistoryFilter(id)
}

function isMentoriaHelp(value: unknown): value is MentoriaHelp {
  if (!value || typeof value !== 'object') return false
  const help = value as Partial<MentoriaHelp>
  return (
    typeof help.id === 'string' &&
    typeof help.helperId === 'string' &&
    typeof help.helperName === 'string' &&
    typeof help.skillName === 'string' &&
    Number.isFinite(help.ra) &&
    Number.isFinite(help.createdAt)
  )
}

export function loadMentoriaHelps(): MentoriaHelp[] {
  const raw = safeParse<unknown>(readStorage(MENTORIA_KEY), [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter(isMentoriaHelp)
    .map((help) => ({
      ...help,
      ra: Math.min(20, Math.max(1, Math.floor(help.ra))),
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20)
}

export function addMentoriaHelp(help: MentoriaHelp) {
  const helps = [help, ...loadMentoriaHelps()].slice(0, 20)
  localStorage.setItem(MENTORIA_KEY, JSON.stringify(helps))
}

export function consumeMentoriaHelp(id: string) {
  const helps = loadMentoriaHelps().filter((help) => help.id !== id)
  localStorage.setItem(MENTORIA_KEY, JSON.stringify(helps))
}

export function clearMentoriaHelps(characterId?: string) {
  if (!characterId) {
    localStorage.setItem(MENTORIA_KEY, JSON.stringify([]))
    return
  }
  const helps = loadMentoriaHelps().filter((help) => help.helperId !== characterId)
  localStorage.setItem(MENTORIA_KEY, JSON.stringify(helps))
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

function loadRollFilters(): Record<string, RollHistoryFilter> {
  const raw = safeParse<unknown>(readStorage(ROLL_FILTER_KEY), {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const filters: Record<string, RollHistoryFilter> = {}
  for (const [characterId, value] of Object.entries(raw)) {
    if (isRollHistoryFilter(value)) filters[characterId] = value
  }
  return filters
}

export function loadRollHistoryFilter(characterId: string): RollHistoryFilter {
  return loadRollFilters()[characterId] ?? 'all'
}

export function saveRollHistoryFilter(characterId: string, filter: RollHistoryFilter) {
  const filters = loadRollFilters()
  if (filter === 'all') delete filters[characterId]
  else filters[characterId] = filter
  try {
    localStorage.setItem(ROLL_FILTER_KEY, JSON.stringify(filters))
  } catch {
    // A preferência de visualização é opcional; a ficha continua funcionando.
  }
}

function removeRollHistoryFilter(characterId: string) {
  try {
    const filters = loadRollFilters()
    if (!(characterId in filters)) return
    delete filters[characterId]
    localStorage.setItem(ROLL_FILTER_KEY, JSON.stringify(filters))
  } catch {
    // A ficha já foi removida; uma falha ao limpar a preferência não deve desfazer isso.
  }
}

export function loadEncounters(): CombatEncounter[] {
  const raw = safeParse<unknown>(readStorage(COMBAT_KEY), [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (entry): entry is Partial<CombatEncounter> =>
        Boolean(entry) && typeof entry === 'object',
    )
    .map((entry) => normalizeEncounter(entry))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 50)
}

export function saveEncounters(encounters: CombatEncounter[]) {
  localStorage.setItem(COMBAT_KEY, JSON.stringify(encounters))
}

export function getEncounter(id: string): CombatEncounter | undefined {
  return loadEncounters().find((encounter) => encounter.id === id)
}

export function upsertEncounter(encounter: CombatEncounter) {
  const encounters = loadEncounters()
  const index = encounters.findIndex((entry) => entry.id === encounter.id)
  const next = { ...encounter, updatedAt: Date.now() }
  if (index >= 0) encounters[index] = next
  else encounters.unshift(next)
  saveEncounters(encounters)
}

export function deleteEncounter(id: string) {
  saveEncounters(loadEncounters().filter((encounter) => encounter.id !== id))
}

export function loadCampaigns(): Campaign[] {
  const raw = safeParse<unknown>(readStorage(CAMPAIGN_KEY), [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (entry): entry is Partial<Campaign> =>
        Boolean(entry) && typeof entry === 'object',
    )
    .map((entry) => normalizeCampaign(entry))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 50)
}

export function saveCampaigns(campaigns: Campaign[]) {
  localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaigns))
}

export function getCampaign(id: string): Campaign | undefined {
  return loadCampaigns().find((campaign) => campaign.id === id)
}

export function upsertCampaign(campaign: Campaign) {
  const campaigns = loadCampaigns()
  const index = campaigns.findIndex((entry) => entry.id === campaign.id)
  const next = { ...campaign, updatedAt: Date.now() }
  if (index >= 0) campaigns[index] = next
  else campaigns.unshift(next)
  saveCampaigns(campaigns)
}

export function deleteCampaign(id: string) {
  saveCampaigns(loadCampaigns().filter((campaign) => campaign.id !== id))
}

/** Remove a ficha das campanhas sem impedir a exclusão da ficha. */
function removeCharacterFromCampaigns(characterId: string) {
  try {
    const campaigns = loadCampaigns()
    let changed = false
    const next = campaigns.map((campaign) => {
      if (!campaign.characterIds.includes(characterId)) return campaign
      changed = true
      return {
        ...campaign,
        characterIds: campaign.characterIds.filter((id) => id !== characterId),
        updatedAt: Date.now(),
      }
    })
    if (changed) saveCampaigns(next)
  } catch {
    // A ficha já foi removida; uma falha ao limpar campanhas não deve desfazer isso.
  }
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
