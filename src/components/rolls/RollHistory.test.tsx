// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { RollDieResult, RollRecord } from '../../types'
import { addRoll, loadRollHistoryFilter, loadRolls } from '../../lib/storage'
import { RollHistory } from './RollHistory'

function makeDie(overrides: Partial<RollDieResult> = {}): RollDieResult {
  return {
    die: 'd8',
    value: 5,
    label: 'Atributo',
    counted: true,
    ...overrides,
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
    dice: [makeDie()],
    createdAt: 1000,
    ...overrides,
  }
}

function renderHistory(onCleared = vi.fn()) {
  return render(
    <RollHistory characterId="char-1" reloadToken={0} onCleared={onCleared} />,
  )
}

describe('histórico de rolagens', () => {
  it('filtra as rolagens e persiste a escolha', async () => {
    const user = userEvent.setup()
    addRoll(makeRoll({ id: 'roll-success', skillName: 'Acrobacia', success: true }))
    addRoll(
      makeRoll({
        id: 'roll-failure',
        skillName: 'Luta',
        success: false,
        total: 4,
      }),
    )

    const { unmount } = renderHistory()

    expect(screen.getByText('Acrobacia')).toBeTruthy()
    expect(screen.getByText('Luta')).toBeTruthy()

    const select = screen.getByLabelText('Filtrar rolagens por resultado')
    await user.selectOptions(select, 'success')

    expect(screen.getByText('Acrobacia')).toBeTruthy()
    expect(screen.queryByText('Luta')).toBeNull()
    expect(loadRollHistoryFilter('char-1')).toBe('success')

    unmount()
    renderHistory()

    expect((screen.getByLabelText('Filtrar rolagens por resultado') as HTMLSelectElement).value).toBe(
      'success',
    )
  })

  it('expande os detalhes dos dados', async () => {
    const user = userEvent.setup()
    addRoll(makeRoll())

    renderHistory()

    const toggle = screen.getByRole('button', { name: /Acrobacia/ })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    await user.click(toggle)

    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('d8 · Atributo · contado')).toBeTruthy()
    expect(screen.getByText('1 dado contado')).toBeTruthy()
  })

  it('mostra uma mensagem quando o filtro não encontra resultados', async () => {
    const user = userEvent.setup()
    addRoll(makeRoll())

    renderHistory()
    await user.selectOptions(
      screen.getByLabelText('Filtrar rolagens por resultado'),
      'critical',
    )

    expect(screen.getByText('Nenhuma rolagem corresponde ao filtro selecionado.')).toBeTruthy()
  })

  it('limpa o histórico e volta o filtro para todas', async () => {
    const user = userEvent.setup()
    const onCleared = vi.fn()
    addRoll(makeRoll())

    renderHistory(onCleared)
    await user.selectOptions(
      screen.getByLabelText('Filtrar rolagens por resultado'),
      'success',
    )
    await user.click(screen.getByRole('button', { name: 'Limpar' }))
    await user.click(screen.getByRole('button', { name: 'Limpar histórico' }))

    expect(onCleared).toHaveBeenCalledTimes(1)
    expect(loadRolls('char-1')).toHaveLength(0)
    expect(loadRollHistoryFilter('char-1')).toBe('all')
  })
})
