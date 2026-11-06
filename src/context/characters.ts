import { createContext, useContext } from 'react'
import type { Character } from '../types'

export interface CharactersContextValue {
  characters: Character[]
  reload: () => void
  save: (character: Character) => void
  remove: (id: string) => void
  duplicate: (character: Character) => Character
  importFromText: (text: string) => number
  exportAll: () => void
}

export const CharactersContext = createContext<CharactersContextValue | null>(null)

export function useCharacters(): CharactersContextValue {
  const context = useContext(CharactersContext)
  if (!context) {
    throw new Error('useCharacters precisa estar dentro de CharactersProvider.')
  }
  return context
}
