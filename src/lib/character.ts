import { APTITUDES, SKILLS } from '../data/skills'
import { OCCUPATION_BY_ID, OCCUPATIONS } from '../data/occupations'
import { PROFILE_BY_ID } from '../data/profiles'
import type {
  Ability,
  AptitudeId,
  AttrKey,
  Character,
  Die,
  ResourcePoints,
  RollableSkill,
  SkillId,
} from '../types'
import { defaultAbilityState, effectiveRollableDie, normalizeAbilityState } from './abilities'
import { dieCost, dieMax } from './dice'

export const ATTR_BUDGET = 8
export const SKILL_BUDGET = 8
export const LEVEL_RESOURCE_POINTS = 6

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function allSkillsAt(die: Die): Record<SkillId, Die> {
  return Object.fromEntries(SKILLS.map((skill) => [skill.id, die])) as Record<SkillId, Die>
}

export function allAptitudesAt(die: Die): Record<AptitudeId, Die> {
  return Object.fromEntries(APTITUDES.map((aptitude) => [aptitude.id, die])) as Record<
    AptitudeId,
    Die
  >
}

export function customOccupationAbility(): Ability {
  return {
    id: 'ocupacao-custom',
    name: 'Habilidade de Ocupação',
    origin: 'ocupacao',
    cost: '—',
    description: 'Descreva com o mestre a habilidade concedida pela sua ocupação.',
    mechanic: 'custom',
  }
}

export function syncAbilities(
  character: Pick<Character, 'abilities' | 'profile' | 'occupationId'>,
): Ability[] {
  const profileAbility = PROFILE_BY_ID[character.profile]?.ability
  const occupation = OCCUPATION_BY_ID[character.occupationId]
  const occupationAbility = occupation ? occupation.ability : customOccupationAbility()
  const extras = character.abilities.filter(
    (ability) => ability.origin === 'custom' || ability.origin === 'nivel',
  )
  return [
    ...(profileAbility ? [profileAbility] : []),
    occupationAbility,
    ...extras,
  ]
}

export function levelResourcePoints(level: number): number {
  return LEVEL_RESOURCE_POINTS * Math.max(0, Math.floor(level) - 1)
}

export function defaultResourcePoints(level: number): ResourcePoints {
  const total = levelResourcePoints(level)
  const pv = Math.floor(total / 2)
  return { pv, pd: total - pv }
}

export function clampResourcePoints(points: ResourcePoints, level: number): ResourcePoints {
  const budget = levelResourcePoints(level)
  let pv = Math.max(0, Math.floor(points.pv))
  let pd = Math.max(0, Math.floor(points.pd))
  let excess = pv + pd - budget
  if (excess > 0) {
    const fromPd = Math.min(pd, excess)
    pd -= fromPd
    excess -= fromPd
    pv = Math.max(0, pv - excess)
  }
  return { pv, pd }
}

export function resourceBase(character: Pick<Character, 'attributes'>) {
  return {
    pv: dieMax(character.attributes.fisico),
    pd: dieMax(character.attributes.emocao),
  }
}

export function resourcePointsSpent(character: Character): number {
  return character.resourcePoints.pv + character.resourcePoints.pd
}

export function resourcePointsRemaining(character: Character): number {
  return Math.max(0, levelResourcePoints(character.level) - resourcePointsSpent(character))
}

export function createEmptyCharacter(overrides: Partial<Character> = {}): Character {
  const base: Character = {
    id: createId(),
    name: '',
    age: '',
    concept: '',
    profile: 'executor',
    occupationId: 'cientista',
    occupation: 'Cientista',
    level: 2,
    nex: 0,
    attributes: { fisico: 'd8', mente: 'd8', emocao: 'd6' },
    skills: allSkillsAt('d4'),
    aptitudes: allAptitudesAt('d4'),
    resourcePoints: defaultResourcePoints(2),
    pv: { current: 8, max: 8 },
    pd: { current: 6, max: 6 },
    impeto: { max: 3, filled: 0 },
    abilities: [],
    abilityState: defaultAbilityState(),
    inventory: [],
    appearance: '',
    personality: '',
    history: '',
    notes: '',
    conditions: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const merged: Character = {
    ...base,
    ...overrides,
    attributes: { ...base.attributes, ...(overrides.attributes ?? {}) },
    abilityState: normalizeAbilityState(overrides.abilityState ?? base.abilityState),
    resourcePoints:
      overrides.resourcePoints ?? defaultResourcePoints(overrides.level ?? base.level),
  }
  const suggested = suggestResources(merged)
  merged.pv = overrides.pv
    ? { ...merged.pv, ...overrides.pv }
    : { current: suggested.pvMax, max: suggested.pvMax }
  merged.pd = overrides.pd
    ? { ...merged.pd, ...overrides.pd }
    : { current: suggested.pdMax, max: suggested.pdMax }
  merged.abilities = overrides.abilities ?? syncAbilities(merged)
  return merged
}

export function getOccupation(character: Character) {
  return OCCUPATION_BY_ID[character.occupationId]
}

export function suggestResources(character: Character) {
  const base = resourceBase(character)
  return {
    pvMax: base.pv + character.resourcePoints.pv,
    pdMax: base.pd + character.resourcePoints.pd,
  }
}

/**
 * Recalcula os máximos de PV/PD a partir dos atributos e dos pontos de nível.
 * Quando o máximo aumenta, o valor atual sobe junto (progressão); quando diminui,
 * o atual é apenas limitado ao novo máximo.
 */
export function syncResourceTotals(character: Character): Character {
  const { pvMax, pdMax } = suggestResources(character)
  const pvGain = Math.max(0, pvMax - character.pv.max)
  const pdGain = Math.max(0, pdMax - character.pd.max)
  return {
    ...character,
    pv: {
      max: pvMax,
      current: Math.min(pvMax, Math.max(0, character.pv.current + pvGain)),
    },
    pd: {
      max: pdMax,
      current: Math.min(pdMax, Math.max(0, character.pd.current + pdGain)),
    },
  }
}

export function withSuggestedResources(character: Character): Character {
  const { pvMax, pdMax } = suggestResources(character)
  return {
    ...character,
    pv: { current: pvMax, max: pvMax },
    pd: { current: pdMax, max: pdMax },
    updatedAt: Date.now(),
  }
}

export function attributeSpent(character: Character): number {
  return (Object.values(character.attributes) as Die[]).reduce(
    (sum, die) => sum + dieCost(die),
    0,
  )
}

export function skillSpent(character: Character): number {
  return (Object.values(character.skills) as Die[]).reduce(
    (sum, die) => sum + Math.max(0, dieCost(die) - 1),
    0,
  )
}

export function getRollableSkills(character: Character): RollableSkill[] {
  const base = SKILLS.map((skill) => ({
    id: skill.id,
    name: skill.name,
    attr: skill.attr,
    die: effectiveRollableDie(character, skill.id),
    kind: 'skill' as const,
  }))
  const aptitudes = APTITUDES.map((aptitude) => ({
    id: `aptidao-${aptitude.id}`,
    name: `Aptidão (${aptitude.name})`,
    attr: 'mente' as AttrKey,
    die: effectiveRollableDie(character, `aptidao-${aptitude.id}`),
    kind: 'aptitude' as const,
  }))
  return [...base, ...aptitudes]
}

export function getSkillDie(character: Character, rollableId: string): Die {
  return effectiveRollableDie(character, rollableId)
}

export function conditionStep(character: Character, attr: AttrKey): number {
  return character.conditions
    .filter((condition) => condition.attr === attr)
    .reduce((sum, condition) => sum + condition.steps, 0)
}

export function validateCharacter(character: Character, freeMode: boolean): string[] {
  const errors: string[] = []
  if (!character.name.trim()) errors.push('Dê um nome ao personagem.')
  if (!character.profile) errors.push('Escolha um perfil.')
  if (!character.occupation.trim()) errors.push('Escolha uma ocupação.')
  if (!freeMode) {
    const attrs = attributeSpent(character)
    if (attrs > ATTR_BUDGET) {
      errors.push(`Você gastou ${attrs} passos de atributo; o limite é ${ATTR_BUDGET}.`)
    }
    const skills = skillSpent(character)
    if (skills > SKILL_BUDGET) {
      errors.push(`Você gastou ${skills} passos de perícia; o limite é ${SKILL_BUDGET}.`)
    }
  }
  if (character.pv.max < 1 || character.pd.max < 1) {
    errors.push('PV e PD máximos precisam ser pelo menos 1.')
  }
  return errors
}

export function defaultOccupationName(): string {
  return OCCUPATIONS[0].name
}
