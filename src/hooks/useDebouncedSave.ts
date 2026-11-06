import { useEffect, useRef, useState } from 'react'
import type { Character } from '../types'

/**
 * Salva a ficha automaticamente depois de uma pausa na edição.
 * Retorna `true` enquanto existir uma alteração pendente.
 */
export function useDebouncedSave(
  character: Character | null,
  save: (character: Character) => void,
  delay = 600,
): boolean {
  const lastSerialized = useRef('')
  const pendingRef = useRef(false)
  const latestRef = useRef<Character | null>(character)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    latestRef.current = character
  }, [character])

  useEffect(() => {
    if (!character) return
    const serialized = JSON.stringify({
      ...character,
      updatedAt: 0,
    })

    if (!lastSerialized.current) {
      lastSerialized.current = serialized
      return
    }

    if (serialized === lastSerialized.current) return

    pendingRef.current = true
    setDirty(true)
    const timer = window.setTimeout(() => {
      save(character)
      lastSerialized.current = serialized
      pendingRef.current = false
      setDirty(false)
    }, delay)

    return () => window.clearTimeout(timer)
  }, [character, save, delay])

  useEffect(() => {
    return () => {
      if (pendingRef.current && latestRef.current) {
        save(latestRef.current)
        pendingRef.current = false
      }
    }
  }, [save])

  return dirty
}
