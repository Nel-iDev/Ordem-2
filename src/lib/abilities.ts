import { ATTR_LABEL, SKILLS } from '../data/skills'
import type {
  Ability,
  AbilityMechanic,
  AbilityState,
  AptitudeId,
  AttrKey,
  Character,
  Die,
  SkillId,
} from '../types'
import { dieIndex, stepDie } from './dice'

/**
 * Regras das habilidades. Este módulo é puro: recebe a ficha e devolve uma
 * ficha nova. Nenhum efeito é gravado direto nos atributos/perícias para que
 * ele não seja aplicado duas vezes quando a ficha for recarregada.
 */

export const AVALIACAO_COST = 2
export const IMPETO_ATTRIBUTE_COST = 3
export const PRONTIDAO_COST = 3
export const FOCO_COST = 2
export const MENTORIA_DT = 7

export function defaultAbilityState(): AbilityState {
  return {
    skillChoices: {},
    avaliacaoCharges: 0,
    avaliacaoTarget: '',
    impetoAttrBuff: null,
    prontidaoUsed: false,
  }
}

function isSkillId(value: unknown): value is SkillId {
  return typeof value === 'string' && SKILLS.some((skill) => skill.id === value)
}

function isAttrKey(value: unknown): value is AttrKey {
  return value === 'fisico' || value === 'mente' || value === 'emocao'
}

/** Normaliza estados antigos/importados, descartando escolhas inválidas. */
export function normalizeAbilityState(input?: Partial<AbilityState> | null): AbilityState {
  const state = input ?? {}
  const skillChoices: Record<string, SkillId> = {}
  const rawChoices =
    state.skillChoices && typeof state.skillChoices === 'object' ? state.skillChoices : {}

  for (const [abilityId, skillId] of Object.entries(rawChoices)) {
    if (isSkillId(skillId)) skillChoices[abilityId] = skillId
  }

  const rawCharges = Number(state.avaliacaoCharges)
  const avaliacaoCharges = Number.isFinite(rawCharges)
    ? Math.min(2, Math.max(0, Math.floor(rawCharges)))
    : 0

  const rawBuff = state.impetoAttrBuff
  const buffSteps =
    rawBuff && Number.isFinite(rawBuff.steps) ? Math.floor(rawBuff.steps) : 0
  const impetoAttrBuff =
    rawBuff && isAttrKey(rawBuff.attr) && buffSteps > 0
      ? { attr: rawBuff.attr, steps: Math.min(1, buffSteps) }
      : null

  return {
    skillChoices,
    avaliacaoCharges,
    avaliacaoTarget: typeof state.avaliacaoTarget === 'string' ? state.avaliacaoTarget : '',
    impetoAttrBuff,
    prontidaoUsed: Boolean(state.prontidaoUsed),
  }
}

export function hasMechanic(
  character: Pick<Character, 'abilities'>,
  mechanic: AbilityMechanic,
): boolean {
  return character.abilities.some((ability) => ability.mechanic === mechanic)
}

export function getAbilityByMechanic(
  character: Pick<Character, 'abilities'>,
  mechanic: AbilityMechanic,
): Ability | undefined {
  return character.abilities.find((ability) => ability.mechanic === mechanic)
}

/** Retorna a perícia escolhida para uma habilidade de elevação, se válida. */
export function skillChoiceFor(
  character: Pick<Character, 'abilities' | 'abilityState'>,
  ability: Ability,
): SkillId | null {
  const choice = character.abilityState.skillChoices[ability.id]
  if (!choice) return null

  const skill = SKILLS.find((entry) => entry.id === choice)
  if (!skill) return null

  if (ability.mechanic === 'conhecimento-tecnico' && skill.attr !== 'mente') return null
  if (ability.mechanic === 'esforco-e-suor' && skill.attr !== 'fisico') return null
  return choice
}

function maxDie(first: Die, second: Die): Die {
  return dieIndex(first) >= dieIndex(second) ? first : second
}

/** Bônus de habilidade aplicável a uma perícia (atualmente d6). */
export function abilitySkillBonus(
  character: Pick<Character, 'abilities' | 'abilityState'>,
  skillId: SkillId,
): Die | null {
  let bonus: Die | null = null

  for (const ability of character.abilities) {
    if (
      ability.mechanic !== 'conhecimento-tecnico' &&
      ability.mechanic !== 'esforco-e-suor'
    ) {
      continue
    }
    if (skillChoiceFor(character, ability) !== skillId) continue
    bonus = bonus ? maxDie(bonus, 'd6') : 'd6'
  }

  return bonus
}

/** Dado efetivo de uma perícia, já considerando Conhecimento Técnico/Esforço. */
export function effectiveSkillDie(
  character: Pick<Character, 'abilities' | 'abilityState' | 'skills'>,
  skillId: SkillId,
): Die {
  const base = character.skills[skillId] ?? 'd4'
  const bonus = abilitySkillBonus(character, skillId)
  return bonus ? maxDie(base, bonus) : base
}

/** Dado bruto (sem bônus de habilidade) de uma perícia ou aptidão. */
export function baseRollableDie(character: Character, rollableId: string): Die {
  if (rollableId.startsWith('aptidao-')) {
    const id = rollableId.replace('aptidao-', '') as AptitudeId
    return character.aptitudes[id] ?? 'd4'
  }
  return character.skills[rollableId as SkillId] ?? 'd4'
}

/** Dado efetivo de uma perícia ou aptidão, usado pelas rolagens. */
export function effectiveRollableDie(character: Character, rollableId: string): Die {
  if (rollableId.startsWith('aptidao-')) return baseRollableDie(character, rollableId)
  return effectiveSkillDie(character, rollableId as SkillId)
}

/** Passos de bônus temporário de atributo (Ímpeto, 3 espaços). */
export function attributeBuffSteps(
  character: Pick<Character, 'abilityState'>,
  attr: AttrKey,
): number {
  const buff = character.abilityState.impetoAttrBuff
  return buff && buff.attr === attr ? Math.max(0, buff.steps) : 0
}

/** Dado efetivo de atributo, já considerando o bônus do Ímpeto. */
export function effectiveAttributeDie(
  character: Pick<Character, 'attributes' | 'abilityState'>,
  attr: AttrKey,
): Die {
  const base = character.attributes[attr]
  const steps = attributeBuffSteps(character, attr)
  return steps > 0 ? stepDie(base, steps) : base
}

function withAbilityState(character: Character, abilityState: AbilityState): Character {
  return { ...character, abilityState, updatedAt: Date.now() }
}

/** Registra/limpa a perícia escolhida em Conhecimento Técnico ou Esforço e Suor. */
export function setAbilitySkillChoice(
  character: Character,
  abilityId: string,
  skillId: SkillId | '',
): Character {
  const skillChoices = { ...character.abilityState.skillChoices }
  if (skillId) skillChoices[abilityId] = skillId
  else delete skillChoices[abilityId]

  return withAbilityState(character, { ...character.abilityState, skillChoices })
}

/**
 * Avaliação: gasta 2 PD e define o alvo observado. A carga é limitada a 2
 * dados, conforme a descrição da habilidade.
 */
export function observeTarget(character: Character, target: string): Character {
  const trimmed = target.trim()
  if (!trimmed) throw new Error('Informe um alvo para a Avaliação.')
  if (character.pd.current < AVALIACAO_COST) {
    throw new Error('PD insuficiente para a Avaliação.')
  }

  return withAbilityState(
    {
      ...character,
      pd: { ...character.pd, current: character.pd.current - AVALIACAO_COST },
    },
    {
      ...character.abilityState,
      avaliacaoCharges: 2,
      avaliacaoTarget: trimmed,
    },
  )
}

/** Consome cargas da Avaliação depois de uma rolagem. */
export function consumeAvaliacao(character: Character, charges: number): Character {
  const used = Math.max(0, Math.floor(charges))
  if (used === 0) return character

  const remaining = Math.max(0, character.abilityState.avaliacaoCharges - used)
  return withAbilityState(character, {
    ...character.abilityState,
    avaliacaoCharges: remaining,
    avaliacaoTarget: remaining > 0 ? character.abilityState.avaliacaoTarget : '',
  })
}

/** Limpa a observação da Avaliação sem devolver PD. */
export function clearAvaliacao(character: Character): Character {
  return withAbilityState(character, {
    ...character.abilityState,
    avaliacaoCharges: 0,
    avaliacaoTarget: '',
  })
}

/** Ímpeto: gasta 3 espaços para +1 passo em um atributo até o fim da cena. */
export function spendImpetoForAttribute(character: Character, attr: AttrKey): Character {
  if (character.impeto.filled < IMPETO_ATTRIBUTE_COST) {
    throw new Error('São necessários 3 espaços de Ímpeto.')
  }
  if (character.abilityState.impetoAttrBuff) {
    throw new Error('Já existe um bônus de Ímpeto ativo nesta cena.')
  }

  return withAbilityState(
    {
      ...character,
      impeto: {
        ...character.impeto,
        filled: character.impeto.filled - IMPETO_ATTRIBUTE_COST,
      },
    },
    {
      ...character.abilityState,
      impetoAttrBuff: { attr, steps: 1 },
    },
  )
}

/** Encerra os efeitos de cena/conflito sem alterar PV, PD ou espaços de Ímpeto. */
export function clearSceneEffects(character: Character): Character {
  return withAbilityState(character, {
    ...character.abilityState,
    impetoAttrBuff: null,
    prontidaoUsed: false,
  })
}

/** Prontidão: gasta 3 PD no início do conflito para agir antes de todos. */
export function activateProntidao(character: Character): Character {
  if (character.abilityState.prontidaoUsed) {
    throw new Error('Prontidão já foi ativada neste conflito.')
  }
  if (character.pd.current < PRONTIDAO_COST) {
    throw new Error('PD insuficiente para ativar Prontidão.')
  }

  return withAbilityState(
    {
      ...character,
      pd: { ...character.pd, current: character.pd.current - PRONTIDAO_COST },
    },
    {
      ...character.abilityState,
      prontidaoUsed: true,
    },
  )
}

export function resetProntidao(character: Character): Character {
  return withAbilityState(character, {
    ...character.abilityState,
    prontidaoUsed: false,
  })
}

export type AbilityStatusTone = 'active' | 'ready' | 'unmet' | 'used' | 'passive'

export interface AbilityStatusInfo {
  ability: Ability
  tone: AbilityStatusTone
  label: string
  detail: string
  requirement?: string
}

function skillName(skillId: SkillId): string {
  return SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId
}

/**
 * Situação de cada habilidade na ficha. Serve para a interface mostrar o que
 * está ativo, o que pode ser usado agora e qual requisito ainda falta.
 */
export function abilityStatuses(
  character: Pick<
    Character,
    'abilities' | 'abilityState' | 'pd' | 'impeto'
  >,
): AbilityStatusInfo[] {
  return character.abilities.map((ability) => {
    switch (ability.mechanic) {
      case 'foco-mental':
      case 'foco-emocional': {
        const ready = character.pd.current >= FOCO_COST
        return {
          ability,
          tone: ready ? 'ready' : 'unmet',
          label: ready ? 'Disponível' : 'PD insuficiente',
          detail: ready
            ? `Gaste ${FOCO_COST} PD durante um teste para receber +d4.`
            : `São necessários ${FOCO_COST} PD.`,
          requirement: ready ? undefined : `Tenha ao menos ${FOCO_COST} PD.`,
        }
      }

      case 'impeto': {
        const buff = character.abilityState.impetoAttrBuff
        if (buff) {
          return {
            ability,
            tone: 'active',
            label: 'Ativa',
            detail: `${ATTR_LABEL[buff.attr]} +${buff.steps} passo até o fim da cena.`,
          }
        }
        if (character.impeto.filled >= IMPETO_ATTRIBUTE_COST) {
          return {
            ability,
            tone: 'ready',
            label: 'Disponível',
            detail: `${character.impeto.filled}/${character.impeto.max} espaços. Gaste 1 para +d4 ou 3 para +1 passo de atributo.`,
          }
        }
        if (character.impeto.filled >= 1) {
          return {
            ability,
            tone: 'ready',
            label: 'Disponível',
            detail: `${character.impeto.filled}/${character.impeto.max} espaços. Gaste 1 para +d4; 3 espaços liberam o bônus de atributo.`,
          }
        }
        return {
          ability,
          tone: 'unmet',
          label: 'Sem carga',
          detail: 'Falhas em testes preenchem 1 espaço de Ímpeto.',
          requirement: 'Preencha ao menos 1 espaço de Ímpeto.',
        }
      }

      case 'avaliacao': {
        const charges = character.abilityState.avaliacaoCharges
        if (charges > 0) {
          return {
            ability,
            tone: 'active',
            label: 'Ativa',
            detail: `${charges} carga${charges > 1 ? 's' : ''} de d4 contra ${
              character.abilityState.avaliacaoTarget || 'o alvo observado'
            }.`,
          }
        }
        const ready = character.pd.current >= AVALIACAO_COST
        return {
          ability,
          tone: ready ? 'ready' : 'unmet',
          label: ready ? 'Disponível' : 'PD insuficiente',
          detail: ready
            ? `Gaste uma ação e ${AVALIACAO_COST} PD para observar um alvo.`
            : `São necessários ${AVALIACAO_COST} PD.`,
          requirement: ready ? undefined : `Tenha ao menos ${AVALIACAO_COST} PD.`,
        }
      }

      case 'prontidao': {
        if (character.abilityState.prontidaoUsed) {
          return {
            ability,
            tone: 'used',
            label: 'Usada',
            detail: 'Já ativada neste conflito. Reinicie ao começar outro.',
          }
        }
        const ready = character.pd.current >= PRONTIDAO_COST
        return {
          ability,
          tone: ready ? 'ready' : 'unmet',
          label: ready ? 'Disponível' : 'PD insuficiente',
          detail: ready
            ? `Gaste ${PRONTIDAO_COST} PD no início do conflito para agir antes de todos.`
            : `São necessários ${PRONTIDAO_COST} PD.`,
          requirement: ready ? undefined : `Tenha ao menos ${PRONTIDAO_COST} PD.`,
        }
      }

      case 'mentoria':
        return {
          ability,
          tone: 'passive',
          label: 'Passiva',
          detail: 'Ao ajudar um aliado, use o modo Ajuda no diálogo de rolagem.',
        }

      case 'conhecimento-tecnico':
      case 'esforco-e-suor': {
        const choice = skillChoiceFor(character, ability)
        if (choice) {
          return {
            ability,
            tone: 'active',
            label: 'Ativa',
            detail: `${skillName(choice)} elevada para d6 (ou mantém o dado maior).`,
          }
        }
        const attrLabel = ability.mechanic === 'conhecimento-tecnico' ? 'mental' : 'física'
        return {
          ability,
          tone: 'unmet',
          label: 'Escolha pendente',
          detail: `Escolha uma perícia ${attrLabel} para receber o aumento.`,
          requirement: `Escolha uma perícia ${attrLabel}.`,
        }
      }

      default:
        return {
          ability,
          tone: 'passive',
          label: 'Passiva',
          detail: 'Habilidade sem efeito automatizado; siga a descrição.',
        }
    }
  })
}
