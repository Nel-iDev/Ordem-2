// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Modal } from './Modal'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      {open ? (
        <Modal
          title="Teste de modal"
          description="Descrição do modal"
          onClose={() => setOpen(false)}
          footer={
            <button type="button" onClick={() => setOpen(false)}>
              Salvar
            </button>
          }
        >
          <label>
            Nome
            <input />
          </label>
          <button type="button">Outro</button>
        </Modal>
      ) : null}
    </>
  )
}

describe('modal', () => {
  it('foca o primeiro campo e prende o foco dentro do diálogo', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy()

    const input = screen.getByLabelText('Nome')
    expect(document.activeElement).toBe(input)

    const save = screen.getByRole('button', { name: 'Salvar' })
    save.focus()
    expect(document.activeElement).toBe(save)

    await user.tab()

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fechar' }))

    await user.tab({ shift: true })

    expect(document.activeElement).toBe(save)
  })

  it('fecha com Escape e devolve o foco ao elemento de origem', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const opener = screen.getByRole('button', { name: 'Abrir' })
    await user.click(opener)
    expect(screen.getByRole('dialog')).toBeTruthy()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })
})
