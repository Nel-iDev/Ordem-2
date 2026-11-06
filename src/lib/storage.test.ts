import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RollRecord } from '../types'
import { createEmptyCharacter } from './character'
import {
  addRoll,
  clearRolls,
  deleteCharacter,
  duplicateCharacter,
  getCharacter,
  loadCharacters,
  loadRolls,
  normalizeCharacter,
  parseImportedCharacters,
  saveCharacters,
  upsertCharacter,
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
})
