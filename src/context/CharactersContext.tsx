import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Character } from '../types'
import {
  clearRolls,
  deleteCharacter,
  duplicateCharacter,
  loadCharacters,
  parseImportedCharacters,
  upsertCharacter,
} from '../lib/storage'
import { createId } from '../lib/character'
import { CharactersContext, type CharactersContextValue } from './characters'

export function CharactersProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>(() => loadCharacters())

  const reload = useCallback(() => {
    setCharacters(loadCharacters())
  }, [])

  const save = useCallback((character: Character) => {
    upsertCharacter(character)
    setCharacters(loadCharacters())
  }, [])

  const remove = useCallback((id: string) => {
    deleteCharacter(id)
    clearRolls(id)
    setCharacters(loadCharacters())
  }, [])

  const duplicate = useCallback((character: Character) => {
    const copy = duplicateCharacter(character)
    setCharacters(loadCharacters())
    return copy
  }, [])

  const importFromText = useCallback((text: string) => {
    const imported = parseImportedCharacters(text)
    const existing = new Set(loadCharacters().map((character) => character.id))
    const prepared = imported.map((character) => {
      const entry = existing.has(character.id)
        ? { ...character, id: createId() }
        : character
      existing.add(entry.id)
      return entry
    })
    prepared.forEach((character) => upsertCharacter(character))
    setCharacters(loadCharacters())
    return prepared.length
  }, [])

  const exportAll = useCallback(() => {
    const blob = new Blob([JSON.stringify(characters, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'arquivo2-fichas.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }, [characters])

  const saveWithFallback = useCallback(
    (character: Character) => {
      try {
        save(character)
      } catch {
        throw new Error('Não foi possível salvar no armazenamento local.')
      }
    },
    [save],
  )

  const value = useMemo<CharactersContextValue>(
    () => ({
      characters,
      reload,
      save: saveWithFallback,
      remove,
      duplicate,
      importFromText,
      exportAll,
    }),
    [characters, reload, saveWithFallback, remove, duplicate, importFromText, exportAll],
  )

  return <CharactersContext.Provider value={value}>{children}</CharactersContext.Provider>
}
