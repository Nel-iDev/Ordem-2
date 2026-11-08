import { describe, expect, it } from 'vitest'
import type { Character } from '../types'
import {
  ATTR_BUDGET,
  SKILL_BUDGET,
  attributeSpent,
  clampResourcePoints,
  conditionStep,
  createEmptyCharacter,
  defaultResourcePoints,
  getRollableSkills,
  getSkillDie,
  levelResourcePoints,
  skillSpent,
  suggestResources,
  syncAbilities,
  syncResourceTotals,
  validateCharacter,
} from './character'

describe('personagem', () => {
  it('cria uma ficha padrão dentro do orçamento', () => {
    const character = createEmptyCharacter()

    expect(character.attributes).toEqual({ fisico: 'd8', mente: 'd8', emocao: 'd6' })
    expect(attributeSpent(character)).toBe(ATTR_BUDGET)
    expect(skillSpent(character)).toBe(0)
    expect(character.resourcePoints).toEqual({ pv: 3, pd: 3 })
    expect(character.pv).toEqual({ current: 11, max: 11 })
    expect(character.pd.current).toBe(9)
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

  it('calcula a base de PV/PD pelos atributos e soma os pontos de nível', () => {
    const character = createEmptyCharacter({
      level: 3,
      occupationId: 'operario',
      occupation: 'Operário',
      attributes: { fisico: 'd10', mente: 'd8', emocao: 'd12' },
      resourcePoints: { pv: 4, pd: 2 },
    })

    expect(suggestResources(character)).toEqual({ pvMax: 14, pdMax: 14 })
    expect(levelResourcePoints(1)).toBe(0)
    expect(levelResourcePoints(2)).toBe(6)
    expect(levelResourcePoints(3)).toBe(12)
  })

  it('distribui os pontos de nível e limita alocações acima do orçamento', () => {
    expect(defaultResourcePoints(1)).toEqual({ pv: 0, pd: 0 })
    expect(defaultResourcePoints(2)).toEqual({ pv: 3, pd: 3 })
    expect(defaultResourcePoints(3)).toEqual({ pv: 6, pd: 6 })
    expect(clampResourcePoints({ pv: 5, pd: 5 }, 2)).toEqual({ pv: 5, pd: 1 })
    expect(clampResourcePoints({ pv: 8, pd: 1 }, 2)).toEqual({ pv: 6, pd: 0 })
    expect(clampResourcePoints({ pv: 2, pd: 4 }, 3)).toEqual({ pv: 2, pd: 4 })
  })

  it('sincroniza os máximos quando o atributo ou o nível sobe', () => {
    const character = createEmptyCharacter({
      level: 2,
      attributes: { fisico: 'd8', mente: 'd8', emocao: 'd6' },
      resourcePoints: { pv: 3, pd: 3 },
    })

    const upgraded = syncResourceTotals({
      ...character,
      attributes: { ...character.attributes, fisico: 'd10' },
    })

    expect(upgraded.pv.max).toBe(13)
    expect(upgraded.pv.current).toBe(13)
    expect(upgraded.pd.max).toBe(9)
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
