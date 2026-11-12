// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { RollableSkill } from '../../types'
import { createEmptyCharacter } from '../../lib/character'
import { RollDialog } from './RollDialog'

function setup(randomValue = 0.99) {
  const character = createEmptyCharacter({ name: 'Helena' })
  character.skills.acrobacia = 'd8'
  vi.spyOn(Math, 'random').mockReturnValue(randomValue)
  const skill: RollableSkill = {
    id: 'acrobacia',
    name: 'Acrobacia',
    attr: 'fisico',
    die: character.skills.acrobacia,
    kind: 'skill',
  }
  const onSave = vi.fn()
  render(
    <RollDialog
      character={character}
      skill={skill}
      onClose={vi.fn()}
      onSave={onSave}
    />,
  )
  return { character, onSave }
}

describe('diálogo de rolagem', () => {
  it('anuncia o resultado e lista os dados rolados', async () => {
    const user = userEvent.setup()
    setup(0.99)

    await user.click(screen.getByRole('button', { name: /Rolar teste/i }))

    expect(screen.getByText('Sucesso crítico')).toBeTruthy()

    const status = screen.getByRole('status')
    expect(status.textContent).toContain('Teste de Acrobacia: Sucesso crítico')
    expect(status.textContent).toContain('dados contados')

    const dice = screen.getByRole('list', { name: 'Dados rolados' })
    expect(within(dice).getAllByRole('listitem')).toHaveLength(2)
    expect(within(dice).getAllByText('contado')).toHaveLength(2)
  })

  it('anuncia a falha crítica e o resultado do 1d8', async () => {
    const user = userEvent.setup()
    setup(0)

    await user.click(screen.getByRole('button', { name: /Rolar teste/i }))

    expect(screen.getAllByText('Falha crítica').length).toBeGreaterThan(0)
    expect(screen.getByRole('status').textContent).toContain('Falha crítica')

    await user.click(screen.getByRole('button', { name: /Rolar 1d8/i }))

    expect(screen.getByText(/Vexame/)).toBeTruthy()
    const announcements = screen
      .getAllByRole('status')
      .map((node) => node.textContent ?? '')
    expect(announcements.some((text) => text.includes('Vexame'))).toBe(true)
  })
})
