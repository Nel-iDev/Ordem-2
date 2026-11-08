import { describe, expect, it } from 'vitest'
import {
  abilityStatuses,
  activateProntidao,
  clearAvaliacao,
  clearSceneEffects,
  consumeAvaliacao,
  defaultAbilityState,
  effectiveAttributeDie,
  effectiveSkillDie,
  normalizeAbilityState,
  observeTarget,
  setAbilitySkillChoice,
  skillChoiceFor,
  spendImpetoForAttribute,
} from './abilities'
import { createEmptyCharacter } from './character'
import { applyMentoriaHelp, evaluateRoll } from './dice'

function officeWorker() {
  return createEmptyCharacter({
    occupationId: 'profissional-de-escritorio',
    occupation: 'Profissional de escritório',
  })
}

describe('habilidades', () => {
  it('normaliza o estado e limita cargas da Avaliação', () => {
    expect(defaultAbilityState()).toEqual({
      skillChoices: {},
      avaliacaoCharges: 0,
      avaliacaoTarget: '',
      impetoAttrBuff: null,
      prontidaoUsed: false,
    })

    const normalized = normalizeAbilityState({
      avaliacaoCharges: 9,
      avaliacaoTarget: 'Criatura',
      skillChoices: { a: 'pesquisa', b: 'inexistente' as never },
      impetoAttrBuff: { attr: 'fisico', steps: 2 },
      prontidaoUsed: true,
    })

    expect(normalized.avaliacaoCharges).toBe(2)
    expect(normalized.avaliacaoTarget).toBe('Criatura')
    expect(normalized.skillChoices).toEqual({ a: 'pesquisa' })
    expect(normalized.impetoAttrBuff).toEqual({ attr: 'fisico', steps: 1 })
    expect(normalized.prontidaoUsed).toBe(true)
  })

  it('aplica a perícia escolhida por Conhecimento Técnico sem passar do dado base', () => {
    const character = officeWorker()
    const ability = character.abilities.find(
      (entry) => entry.mechanic === 'conhecimento-tecnico',
    )
    expect(ability).toBeDefined()

    const withChoice = setAbilitySkillChoice(character, ability!.id, 'pesquisa')
    expect(skillChoiceFor(withChoice, ability!)).toBe('pesquisa')
    expect(effectiveSkillDie(withChoice, 'pesquisa')).toBe('d6')
    expect(effectiveSkillDie(withChoice, 'acrobacia')).toBe('d4')

    const higherBase = setAbilitySkillChoice(
      { ...withChoice, skills: { ...withChoice.skills, pesquisa: 'd10' } },
      ability!.id,
      'pesquisa',
    )
    expect(effectiveSkillDie(higherBase, 'pesquisa')).toBe('d10')

    const wrongAttribute = setAbilitySkillChoice(character, ability!.id, 'acrobacia')
    expect(skillChoiceFor(wrongAttribute, ability!)).toBeNull()
    expect(effectiveSkillDie(wrongAttribute, 'acrobacia')).toBe('d4')
  })

  it('gasta 3 espaços de Ímpeto para +1 passo de atributo até o fim da cena', () => {
    const character = createEmptyCharacter({ impeto: { max: 3, filled: 3 } })
    const buffed = spendImpetoForAttribute(character, 'fisico')

    expect(buffed.impeto.filled).toBe(0)
    expect(buffed.abilityState.impetoAttrBuff).toEqual({ attr: 'fisico', steps: 1 })
    expect(effectiveAttributeDie(buffed, 'fisico')).toBe('d10')
    expect(effectiveAttributeDie(buffed, 'mente')).toBe('d8')
    expect(() => spendImpetoForAttribute(buffed, 'mente')).toThrow()

    const cleared = clearSceneEffects(buffed)
    expect(cleared.abilityState.impetoAttrBuff).toBeNull()
    expect(effectiveAttributeDie(cleared, 'fisico')).toBe('d8')
  })

  it('observa um alvo com 2 PD e consome as cargas da Avaliação', () => {
    const character = createEmptyCharacter({ profile: 'analista' })
    const observed = observeTarget(character, 'Criatura')

    expect(observed.pd.current).toBe(character.pd.current - 2)
    expect(observed.abilityState.avaliacaoCharges).toBe(2)
    expect(observed.abilityState.avaliacaoTarget).toBe('Criatura')

    const partial = consumeAvaliacao(observed, 1)
    expect(partial.abilityState.avaliacaoCharges).toBe(1)
    expect(partial.abilityState.avaliacaoTarget).toBe('Criatura')

    const empty = consumeAvaliacao(partial, 1)
    expect(empty.abilityState.avaliacaoCharges).toBe(0)
    expect(empty.abilityState.avaliacaoTarget).toBe('')

    const cleared = clearAvaliacao(observed)
    expect(cleared.abilityState.avaliacaoCharges).toBe(0)
    expect(() =>
      observeTarget({ ...character, pd: { ...character.pd, current: 1 } }, 'Alvo'),
    ).toThrow()
    expect(() => observeTarget(character, '   ')).toThrow()
  })

  it('ativa Prontidão uma vez por conflito e reinicia ao limpar a cena', () => {
    const character = createEmptyCharacter({ profile: 'vigilante' })
    const activated = activateProntidao(character)

    expect(activated.pd.current).toBe(character.pd.current - 3)
    expect(activated.abilityState.prontidaoUsed).toBe(true)
    expect(() => activateProntidao(activated)).toThrow()

    const cleared = clearSceneEffects(activated)
    expect(cleared.abilityState.prontidaoUsed).toBe(false)
  })

  it('expõe o requisito pendente das habilidades de escolha', () => {
    const character = officeWorker()
    const pending = abilityStatuses(character).find(
      (entry) => entry.ability.mechanic === 'conhecimento-tecnico',
    )

    expect(pending?.tone).toBe('unmet')
    expect(pending?.requirement).toContain('mental')

    const resolved = setAbilitySkillChoice(character, pending!.ability.id, 'pesquisa')
    const active = abilityStatuses(resolved).find(
      (entry) => entry.ability.mechanic === 'conhecimento-tecnico',
    )
    expect(active?.tone).toBe('active')
  })

  it('substitui o menor dado contado pela rolagem alta da Mentoria', () => {
    const result = evaluateRoll(
      [
        { die: 'd8', label: 'Atributo', value: 5, counted: true },
        { die: 'd6', label: 'Perícia', value: 4, counted: true },
        { die: 'd4', label: 'Extra', value: 3, counted: true },
        { die: 'd4', label: 'Extra', value: 1, counted: false },
      ],
      7,
    )

    expect(result.total).toBe(12)
    const helped = applyMentoriaHelp(result, 6)
    expect(helped.total).toBe(15)
    expect(helped.ra).toBe(6)
    expect(helped.dice.some((entry) => entry.label.includes('Mentoria'))).toBe(true)
  })

  it('recalcula falha crítica depois da substituição da Mentoria', () => {
    const result = evaluateRoll(
      [
        { die: 'd8', label: 'Atributo', value: 1, counted: true },
        { die: 'd6', label: 'Perícia', value: 1, counted: true },
      ],
      7,
    )

    expect(result.criticalFailure).toBe(true)
    expect(result.success).toBe(false)

    const helped = applyMentoriaHelp(result, 6)
    expect(helped.criticalFailure).toBe(false)
    expect(helped.success).toBe(true)
  })
})
