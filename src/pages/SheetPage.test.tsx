// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Character } from '../types'
import { createEmptyCharacter } from '../lib/character'
import { saveCharacters } from '../lib/storage'
import { CharactersProvider } from '../context/CharactersContext'
import { ToastProvider } from '../context/ToastContext'
import { SheetPage } from './SheetPage'

function renderSheet(character: Character = createEmptyCharacter({ name: 'Helena' })) {
  saveCharacters([character])
  render(
    <MemoryRouter initialEntries={[`/ficha/${character.id}`]}>
      <ToastProvider>
        <CharactersProvider>
          <Routes>
            <Route path="/ficha/:id" element={<SheetPage />} />
          </Routes>
        </CharactersProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
  return character
}

function panelFor(tab: HTMLElement): HTMLElement {
  const id = tab.getAttribute('aria-controls')
  const panel = id ? document.getElementById(id) : null
  if (!panel) throw new Error('Painel da aba não encontrado')
  return panel
}

describe('abas da ficha', () => {
  it('expõe a aba ativa e o painel correspondente', () => {
    renderSheet()

    const skills = screen.getByRole('tab', { name: 'Perícias' })
    expect(skills.getAttribute('aria-selected')).toBe('true')
    expect(skills.getAttribute('tabindex')).toBe('0')
    expect(panelFor(skills).hidden).toBe(false)

    const history = screen.getByRole('tab', { name: 'Histórico' })
    expect(history.getAttribute('aria-selected')).toBe('false')
    expect(history.getAttribute('tabindex')).toBe('-1')
    expect(panelFor(history).hidden).toBe(true)
  })

  it('navega entre abas com as setas, Home e End', async () => {
    const user = userEvent.setup()
    renderSheet()

    const skills = screen.getByRole('tab', { name: 'Perícias' })
    skills.focus()

    await user.keyboard('{ArrowRight}')
    const abilities = screen.getByRole('tab', { name: /Habilidades/ })
    expect(abilities.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(abilities)
    expect(panelFor(abilities).hidden).toBe(false)
    expect(panelFor(skills).hidden).toBe(true)

    await user.keyboard('{End}')
    const history = screen.getByRole('tab', { name: 'Histórico' })
    expect(history.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(history)

    await user.keyboard('{Home}')
    expect(skills.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(skills)

    await user.keyboard('{ArrowLeft}')
    expect(history.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(history)
  })
})
