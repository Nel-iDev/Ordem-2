export type Die = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20'

export type AttrKey = 'fisico' | 'mente' | 'emocao'

export type ProfileId = 'executor' | 'analista' | 'vigilante'

export type SkillId =
  | 'acrobacia'
  | 'aptidao'
  | 'atletismo'
  | 'crime'
  | 'disciplina'
  | 'enganacao'
  | 'furtividade'
  | 'intimidacao'
  | 'intuicao'
  | 'luta'
  | 'maquinas'
  | 'medicina'
  | 'ocultismo'
  | 'percepcao'
  | 'persuasao'
  | 'pesquisa'
  | 'pontaria'
  | 'sobrevivencia'
  | 'tecnologia'
  | 'vigor'

export type AptitudeId =
  | 'artes'
  | 'atualidades'
  | 'burocracia'
  | 'exatas'
  | 'humanas'
  | 'tatica'

export interface AttributeDef {
  key: AttrKey
  name: string
  short: string
  description: string
}

export interface SkillDef {
  id: SkillId
  name: string
  attr: AttrKey
  description: string
  trainedOnly?: boolean
}

export interface AptitudeDef {
  id: AptitudeId
  name: string
  description: string
}

export type AbilityMechanic =
  | 'foco-mental'
  | 'foco-emocional'
  | 'avaliacao'
  | 'impeto'
  | 'prontidao'
  | 'mentoria'
  | 'conhecimento-tecnico'
  | 'esforco-e-suor'
  | 'custom'

export interface Ability {
  id: string
  name: string
  origin: 'perfil' | 'ocupacao' | 'nivel' | 'custom'
  cost: string
  description: string
  pdCost?: number
  mechanic?: AbilityMechanic
}

export interface ProfileDef {
  id: ProfileId
  name: string
  tagline: string
  description: string
  ability: Ability
  accent: string
}

export interface OccupationDef {
  id: string
  name: string
  summary: string
  ability: Ability
  pvBonus: number
}

export interface InventoryItem {
  id: string
  name: string
  qty: number
  category: 'arma' | 'protecao' | 'geral' | 'paranormal'
  notes: string
}

export interface Condition {
  id: string
  label: string
  attr: AttrKey
  steps: number
}

export interface Character {
  id: string
  name: string
  age: string
  concept: string
  portrait?: string
  profile: ProfileId
  occupationId: string
  occupation: string
  level: number
  nex: number
  attributes: Record<AttrKey, Die>
  skills: Record<SkillId, Die>
  aptitudes: Record<AptitudeId, Die>
  pv: { current: number; max: number }
  pd: { current: number; max: number }
  impeto: { max: number; filled: number }
  abilities: Ability[]
  inventory: InventoryItem[]
  appearance: string
  personality: string
  history: string
  notes: string
  conditions: Condition[]
  createdAt: number
  updatedAt: number
}

export interface RollDieResult {
  die: Die
  value: number
  label: string
  counted: boolean
}

export interface RollResult {
  dice: RollDieResult[]
  total: number
  ra: number
  rb: number
  critical: boolean
  criticalFailure: boolean
  success: boolean
  dt: number
}

export interface RollRecord {
  id: string
  characterId: string
  characterName: string
  skillName: string
  dt: number
  total: number
  ra: number
  rb: number
  critical: boolean
  criticalFailure: boolean
  success: boolean
  dice: RollDieResult[]
  createdAt: number
  note?: string
}

export interface RollableSkill {
  id: string
  name: string
  attr: AttrKey
  die: Die
  kind: 'skill' | 'aptitude'
}
