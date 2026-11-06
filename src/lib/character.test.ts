import { describe, expect, it } from 'vitest'
import type { Character } from '../types'
import {
  ATTR_BUDGET,
  SKILL_BUDGET,
  attributeSpent,
  conditionStep,
  createEmptyCharacter,
  getRollableSkills,
  getSkillDie,
  skillSpent,
  suggestResources,
  syncAbilities,
  validateCharacter,
} from './character'

describe('personagem', () => {
  it('cria uma ficha padrão dentro do orçamento', () => {
    const character = createEmptyCharacter()

    expect(character.attributes).toEqual({ fisico: 'd8', mente: 'd8', emocao: 'd6' })
    expect(attributeSpent(character)).toBe(ATTR_BUDGET)
    expect(skillSpent(character)).toBe(0)
    expect(character.pv).toEqual({ current: 12, max: 12 })
    expect(character.pd.current).toBe(14)
    expect(character.abilities.length).toBe(2)
  })

  it('sincroniza habilidades ao trocar perfil e ocupação', () => {
    const character = createEmptyCharacter({
      profile: 'vigilante',
      occupationId: 'professor',
      occupation: 'Professor',
    })
    const abilities = syncAbilities(character)

    expect(abilities.map((ability) => ability.id)).toContain('perfil-vigilante')
    expect(abilities.map((ability) => ability.id)).toContain('ocupacao-professor')
  })

  it('preserva habilidades personalizadas ao sincronizar', () => {
    const character = createEmptyCharacter()
    character.abilities = [
      ...character.abilities,
      {
        id: 'custom-1',
        name: 'Visão no escuro',
        origin: 'custom',
        cost: 'Passivo',
        description: 'Enxerga no escuro.',
        mechanic: 'custom',
      },
    ]

    const abilities = syncAbilities(character)
    expect(abilities.some((ability) => ability.id === 'custom-1')).toBe(true)
  })

  it('calcula PV e PD sugeridos com ocupação e nível', () => {
    const character = createEmptyCharacter({
      level: 3,
      occupationId: 'operario',
      occupation: 'Operário',
      attributes: { fisico: 'd10', mente: 'd8', emocao: 'd12' },
    })

    expect(suggestResources(character)).toEqual({ pvMax: 20, pdMax: 20 })
  })

  it('acumula passos de condição por atributo', () => {
    const character = createEmptyCharacter({
      conditions: [
        { id: '1', label: 'Machucado', attr: 'fisico', steps: 1 },
        { id: '2', label: 'Ferido', attr: 'fisico', steps: 2 },
        { id: '3', label: 'Desatenção', attr: 'mente', steps: 1 },
      ],
    })

    expect(conditionStep(character, 'fisico')).toBe(3)
    expect(conditionStep(character, 'mente')).toBe(1)
    expect(conditionStep(character, 'emocao')).toBe(0)
  })

  it('valida nome e orçamentos, com modo livre opcional', () => {
    const character = createEmptyCharacter({
      name: '',
      attributes: { fisico: 'd12', mente: 'd12', emocao: 'd12' },
      skills: { ...createEmptyCharacter().skills, acrobacia: 'd12' },
    })

    const strict = validateCharacter(character, false)
    expect(strict).toContain('Dê um nome ao personagem.')
    expect(strict.some((error) => error.includes('limite é 8'))).toBe(true)

    const free = validateCharacter({ ...character, name: 'Agente' }, true)
    expect(free).toEqual([])
  })

  it('limita o orçamento de perícias a 8 passos', () => {
    const base = createEmptyCharacter()
    const character: Character = {
      ...base,
      skills: {
        ...base.skills,
        acrobacia: 'd12',
        atletismo: 'd12',
      },
    }

    expect(skillSpent(character)).toBe(8)
    expect(
      skillSpent({
        ...character,
        skills: { ...character.skills, crime: 'd6' },
      }),
    ).toBe(9)
    expect(SKILL_BUDGET).toBe(8)
  })

  it('monta a lista rolável de perícias e aptidões', () => {
    const character = createEmptyCharacter()
    const rollables = getRollableSkills(character)

    expect(rollables).toHaveLength(26)
    expect(rollables.some((entry) => entry.kind === 'aptitude')).toBe(true)
    expect(getSkillDie(character, 'aptidao-exatas')).toBe('d4')
    expect(getSkillDie(character, 'acrobacia')).toBe('d4')
  })
})
