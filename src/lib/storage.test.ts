import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RollRecord } from '../types'
import { createEmptyCharacter } from './character'
import { addCombatant, createEncounter, createNpcCombatant } from './combat'
import { addCharacterToCampaign, createCampaign, patchCampaign } from './campaigns'
import {
  addMentoriaHelp,
  addRoll,
  clearMentoriaHelps,
  clearRolls,
  consumeMentoriaHelp,
  deleteCampaign,
  deleteCharacter,
  deleteEncounter,
  duplicateCharacter,
  getCampaign,
  getCharacter,
  getEncounter,
  loadCampaigns,
  loadCharacters,
  loadEncounters,
  loadMentoriaHelps,
  loadRollHistoryFilter,
  loadRolls,
  normalizeCharacter,
  parseImportedCharacters,
  saveCampaigns,
  saveCharacters,
  saveEncounters,
  saveRollHistoryFilter,
  upsertCampaign,
  upsertCharacter,
  upsertEncounter,
} from './storage'

class MemoryStorage {
  private map = new Map<string, string>()

  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null
  }

  get length(): number {
    return this.map.size
  }
}

function makeRoll(overrides: Partial<RollRecord> = {}): RollRecord {
  return {
    id: 'roll-1',
    characterId: 'char-1',
    characterName: 'Agente',
    skillName: 'Acrobacia',
    dt: 7,
    total: 8,
    ra: 5,
    rb: 3,
    critical: false,
    criticalFailure: false,
    success: true,
    dice: [],
    createdAt: 1000,
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('armazenamento', () => {
  it('normaliza fichas incompletas com os valores padrão', () => {
    const character = normalizeCharacter({ name: 'Helena' })

    expect(character.name).toBe('Helena')
    expect(Object.keys(character.skills)).toHaveLength(20)
    expect(Object.keys(character.aptitudes)).toHaveLength(6)
    expect(character.abilities.length).toBe(2)
    expect(character.pv.max).toBeGreaterThan(0)
    expect(character.abilityState).toEqual({
      skillChoices: {},
      avaliacaoCharges: 0,
      avaliacaoTarget: '',
      impetoAttrBuff: null,
      prontidaoUsed: false,
    })
  })

  it('normaliza o estado de habilidades de fichas antigas', () => {
    const character = normalizeCharacter({
      name: 'Helena',
      abilityState: {
        skillChoices: { habilidade: 'pesquisa' },
        avaliacaoCharges: 7,
        avaliacaoTarget: 'Criatura',
        impetoAttrBuff: { attr: 'fisico', steps: 1 },
        prontidaoUsed: true,
      },
    })

    expect(character.abilityState.avaliacaoCharges).toBe(2)
    expect(character.abilityState.avaliacaoTarget).toBe('Criatura')
    expect(character.abilityState.skillChoices).toEqual({ habilidade: 'pesquisa' })
    expect(character.abilityState.impetoAttrBuff).toEqual({ attr: 'fisico', steps: 1 })
    expect(character.abilityState.prontidaoUsed).toBe(true)
  })

  it('salva, carrega e atualiza fichas', () => {
    const first = createEmptyCharacter({ name: 'Helena' })
    const second = createEmptyCharacter({ name: 'Bruno' })

    saveCharacters([first, second])
    expect(loadCharacters()).toHaveLength(2)

    upsertCharacter({ ...first, name: 'Helena Vasques' })
    expect(getCharacter(first.id)?.name).toBe('Helena Vasques')
    expect(loadCharacters()).toHaveLength(2)

    deleteCharacter(second.id)
    expect(loadCharacters()).toHaveLength(1)
    expect(getCharacter(second.id)).toBeUndefined()
  })

  it('duplica uma ficha com novo id e nome de cópia', () => {
    const original = createEmptyCharacter({ name: 'Helena' })
    saveCharacters([original])

    const copy = duplicateCharacter(original)

    expect(copy.id).not.toBe(original.id)
    expect(copy.name).toBe('Helena (cópia)')
    expect(loadCharacters()).toHaveLength(2)
  })

  it('importa uma ou várias fichas de JSON', () => {
    const single = createEmptyCharacter({ name: 'Helena' })
    expect(parseImportedCharacters(JSON.stringify(single))[0]?.name).toBe('Helena')

    const many = parseImportedCharacters(
      JSON.stringify([
        { name: 'Helena' },
        { name: 'Bruno' },
      ]),
    )
    expect(many.map((character) => character.name)).toEqual(['Helena', 'Bruno'])
  })

  it('rejeita arquivos de importação inválidos', () => {
    expect(() => parseImportedCharacters('[]')).toThrow('inválido')
    expect(() => parseImportedCharacters('"texto"')).toThrow('inválido')
    expect(() => parseImportedCharacters('{')).toThrow()
  })

  it('registra, filtra e limpa rolagens', () => {
    addRoll(makeRoll({ id: 'roll-1', characterId: 'char-1' }))
    addRoll(makeRoll({ id: 'roll-2', characterId: 'char-2', skillName: 'Luta' }))

    expect(loadRolls()).toHaveLength(2)
    expect(loadRolls('char-1')).toHaveLength(1)
    expect(loadRolls('char-1')[0]?.skillName).toBe('Acrobacia')

    clearRolls('char-1')
    expect(loadRolls('char-1')).toHaveLength(0)
    expect(loadRolls()).toHaveLength(1)
  })

  it('registra, consome e limpa ajudas de Mentoria', () => {
    const help = {
      id: 'help-1',
      helperId: 'char-1',
      helperName: 'Helena',
      skillName: 'Luta',
      ra: 5,
      createdAt: 1000,
    }

    addMentoriaHelp(help)
    expect(loadMentoriaHelps()).toEqual([help])

    consumeMentoriaHelp(help.id)
    expect(loadMentoriaHelps()).toHaveLength(0)

    addMentoriaHelp(help)
    clearMentoriaHelps('char-1')
    expect(loadMentoriaHelps()).toHaveLength(0)
  })

  it('salva, atualiza e exclui cenas de combate', () => {
    const first = addCombatant(
      createEncounter('Emboscada'),
      createNpcCombatant({
        name: 'Capanga',
        pvMax: 6,
        pdMax: 4,
        initiative: 5,
      }),
    )
    const second = createEncounter('Perseguição')

    saveEncounters([first])
    expect(loadEncounters()).toHaveLength(1)
    expect(getEncounter(first.id)?.name).toBe('Emboscada')

    upsertEncounter(second)
    expect(loadEncounters()).toHaveLength(2)
    expect(getEncounter(second.id)?.name).toBe('Perseguição')

    upsertEncounter({ ...first, name: 'Emboscada noturna' })
    expect(getEncounter(first.id)?.name).toBe('Emboscada noturna')
    expect(loadEncounters()).toHaveLength(2)

    deleteEncounter(first.id)
    expect(getEncounter(first.id)).toBeUndefined()
    expect(loadEncounters()).toHaveLength(1)
  })

  it('salva, atualiza e exclui campanhas', () => {
    const first = patchCampaign(createCampaign('Operação Véu Negro'), {
      status: 'pausada',
      description: 'Mesa principal',
    })
    const second = createCampaign('Crônicas')

    saveCampaigns([first])
    expect(loadCampaigns()).toHaveLength(1)
    expect(getCampaign(first.id)?.status).toBe('pausada')

    upsertCampaign(second)
    expect(loadCampaigns()).toHaveLength(2)
    expect(getCampaign(second.id)?.name).toBe('Crônicas')

    upsertCampaign({ ...first, name: 'Operação Véu Negro II' })
    expect(getCampaign(first.id)?.name).toBe('Operação Véu Negro II')
    expect(loadCampaigns()).toHaveLength(2)

    deleteCampaign(first.id)
    expect(getCampaign(first.id)).toBeUndefined()
    expect(loadCampaigns()).toHaveLength(1)
  })

  it('desvincula a ficha de todas as campanhas ao excluir o personagem', () => {
    const character = createEmptyCharacter({ name: 'Helena' })
    saveCharacters([character])

    const campaign = addCharacterToCampaign(createCampaign('Mesa'), character.id)
    saveCampaigns([campaign])
    expect(getCampaign(campaign.id)?.characterIds).toEqual([character.id])

    deleteCharacter(character.id)

    expect(getCharacter(character.id)).toBeUndefined()
    expect(getCampaign(campaign.id)?.characterIds).toEqual([])
    expect(getCampaign(campaign.id)?.name).toBe('Mesa')
  })

  it('persiste o filtro do histórico por ficha', () => {
    expect(loadRollHistoryFilter('char-1')).toBe('all')

    saveRollHistoryFilter('char-1', 'success')
    saveRollHistoryFilter('char-2', 'critical')

    expect(loadRollHistoryFilter('char-1')).toBe('success')
    expect(loadRollHistoryFilter('char-2')).toBe('critical')

    saveRollHistoryFilter('char-1', 'all')
    expect(loadRollHistoryFilter('char-1')).toBe('all')
    expect(loadRollHistoryFilter('char-2')).toBe('critical')
  })

  it('ignora filtros inválidos e remove a preferência ao excluir a ficha', () => {
    localStorage.setItem(
      'arquivo2.rollFilters.v1',
      JSON.stringify({ 'char-1': 'invalido', 'char-2': 'failure' }),
    )

    expect(loadRollHistoryFilter('char-1')).toBe('all')
    expect(loadRollHistoryFilter('char-2')).toBe('failure')

    const character = createEmptyCharacter({ name: 'Helena' })
    saveCharacters([character])
    saveRollHistoryFilter(character.id, 'critical')
    deleteCharacter(character.id)

    expect(loadRollHistoryFilter(character.id)).toBe('all')
  })

  it('tolera JSON inválido nas preferências de filtro', () => {
    localStorage.setItem('arquivo2.rollFilters.v1', '{')
    expect(loadRollHistoryFilter('char-1')).toBe('all')
  })
})
