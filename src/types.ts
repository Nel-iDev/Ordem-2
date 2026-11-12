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

/**
 * Estado mutável das habilidades na ficha. Fica separado das definições em
 * `data/` para que o mesmo perfil/ocupação possa ser compartilhado sem que
 * escolhas e cargas de um personagem vazem para outro.
 */
export interface AbilityState {
  /** Perícia escolhida em habilidades de elevação (ex.: Conhecimento Técnico). */
  skillChoices: Record<string, SkillId>
  /** Cargas de bônus d4 da Avaliação (0 a 2). */
  avaliacaoCharges: number
  /** Alvo observado para a Avaliação. */
  avaliacaoTarget: string
  /** Bônus temporário de atributo do Ímpeto (3 espaços). */
  impetoAttrBuff: { attr: AttrKey; steps: number } | null
  /** Prontidão já ativada no conflito atual. */
  prontidaoUsed: boolean
}

/**
 * Ajuda gerada pela habilidade Mentoria. Fica fora da ficha porque o bônus é
 * consumido por outro personagem, no teste do aliado ajudado.
 */
export interface MentoriaHelp {
  id: string
  helperId: string
  helperName: string
  skillName: string
  ra: number
  createdAt: number
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
}

export interface ResourcePoints {
  pv: number
  pd: number
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
  resourcePoints: ResourcePoints
  pv: { current: number; max: number }
  pd: { current: number; max: number }
  impeto: { max: number; filled: number }
  abilities: Ability[]
  abilityState: AbilityState
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

/**
 * Participante de uma cena de combate. Personagens são vinculados à ficha e
 * usam PV/PD ao vivo; NPCs guardam os próprios recursos.
 */
interface CombatantBase {
  id: string
  /** Nome de exibição. Em personagens vinculados, o nome atual da ficha tem prioridade. */
  name: string
  initiative: number
  defeated: boolean
}

export interface CharacterCombatant extends CombatantBase {
  kind: 'character'
  characterId: string
}

export interface NpcCombatant extends CombatantBase {
  kind: 'npc'
  pv: { current: number; max: number }
  pd: { current: number; max: number }
}

export type Combatant = CharacterCombatant | NpcCombatant

export type CombatPhase = 'prontidao' | 'normal'

export interface CombatEncounter {
  id: string
  name: string
  round: number
  phase: CombatPhase
  /** Participante do turno atual. */
  currentId: string | null
  /** Participantes que ganharam a rodada extra de Prontidão no início da cena. */
  prontidaoIds: string[]
  active: boolean
  combatants: Combatant[]
  createdAt: number
  updatedAt: number
}

export type CampaignStatus = 'ativa' | 'pausada' | 'encerrada'

export interface CampaignSession {
  id: string
  title: string
  /** Data da sessão no formato YYYY-MM-DD; vazio quando não informada. */
  date: string
  summary: string
  notes: string
  createdAt: number
  updatedAt: number
}

export interface Campaign {
  id: string
  name: string
  description: string
  status: CampaignStatus
  /** Fichas vinculadas. A campanha guarda apenas os IDs para refletir a ficha atual. */
  characterIds: string[]
  sessions: CampaignSession[]
  createdAt: number
  updatedAt: number
}
