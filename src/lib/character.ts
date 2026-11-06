import { APTITUDES, SKILLS } from '../data/skills'
import { OCCUPATION_BY_ID, OCCUPATIONS } from '../data/occupations'
import { PROFILE_BY_ID } from '../data/profiles'
import type {
  Ability,
  AptitudeId,
  AttrKey,
  Character,
  Die,
  RollableSkill,
  SkillId,
} from '../types'
import { dieCost, dieMax } from './dice'

export const ATTR_BUDGET = 8
export const SKILL_BUDGET = 8

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
    pv: { current: 12, max: 12 },
    pd: { current: 14, max: 14 },
    impeto: { max: 3, filled: 0 },
    abilities: [],
    inventory: [],
    appearance: '',
    personality: '',
    history: '',
    notes: '',
    conditions: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const merged = { ...base, ...overrides }
  merged.abilities = overrides.abilities ?? syncAbilities(merged)
  return merged
}

export function getOccupation(character: Character) {
  return OCCUPATION_BY_ID[character.occupationId]
}

export function suggestResources(character: Character) {
  const occupation = getOccupation(character)
  const pvMax =
    dieMax(character.attributes.fisico) + 2 * character.level + (occupation?.pvBonus ?? 0)
  const pdMax = dieMax(character.attributes.mente) + dieMax(character.attributes.emocao)
  return { pvMax, pdMax }
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
    die: character.skills[skill.id],
    kind: 'skill' as const,
  }))
  const aptitudes = APTITUDES.map((aptitude) => ({
    id: `aptidao-${aptitude.id}`,
    name: `Aptidão (${aptitude.name})`,
    attr: 'mente' as AttrKey,
    die: character.aptitudes[aptitude.id],
    kind: 'aptitude' as const,
  }))
  return [...base, ...aptitudes]
}

export function getSkillDie(character: Character, rollableId: string): Die {
  if (rollableId.startsWith('aptidao-')) {
    const id = rollableId.replace('aptidao-', '') as AptitudeId
    return character.aptitudes[id] ?? 'd4'
  }
  return character.skills[rollableId as SkillId] ?? 'd4'
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
