import { useId, useState, type FormEvent } from 'react'
import { todayIsoDate } from '../../lib/campaigns'
import { Modal } from '../ui/Modal'

export interface SessionFormValues {
  title: string
  date: string
  summary: string
  notes: string
}

interface SessionFormDialogProps {
  title: string
  submitLabel: string
  initial?: SessionFormValues
  onSubmit: (values: SessionFormValues) => void
  onClose: () => void
}

function defaultValues(): SessionFormValues {
  return {
    title: '',
    date: todayIsoDate(),
    summary: '',
    notes: '',
  }
}

export function SessionFormDialog({
  title,
  submitLabel,
  initial,
  onSubmit,
  onClose,
}: SessionFormDialogProps) {
  const base = initial ?? defaultValues()
  const [sessionTitle, setSessionTitle] = useState(base.title)
  const [date, setDate] = useState(base.date)
  const [summary, setSummary] = useState(base.summary)
  const [notes, setNotes] = useState(base.notes)
  const [error, setError] = useState('')
  const errorId = useId()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = sessionTitle.trim()
    if (!trimmed) {
      setError('Dê um título à sessão.')
      return
    }
    onSubmit({
      title: trimmed,
      date,
      summary: summary.trim(),
      notes: notes.trim(),
    })
  }

  return (
    <Modal
      title={title}
      description="Registre o que aconteceu na mesa para consultar depois."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="session-form" className="btn btn-primary">
            {submitLabel}
          </button>
        </>
      }
    >
      <form id="session-form" className="stack-sm" onSubmit={handleSubmit}>
        <div className="input-row">
          <label className="field">
            <span>Título</span>
            <input
              className="input"
              value={sessionTitle}
              onChange={(event) => {
                setSessionTitle(event.target.value)
                setError('')
              }}
              placeholder="Ex.: O casarão na Rua Bela"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
          </label>
          <label className="field">
            <span>Data</span>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>Resumo</span>
          <textarea
            className="textarea"
            rows={3}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="O que o grupo descobriu, enfrentou ou decidiu."
          />
        </label>
        <label className="field">
          <span>Anotações</span>
          <textarea
            className="textarea"
            rows={5}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Pistas, NPCs, ganchos e consequências."
          />
        </label>
        {error ? (
          <p className="form-error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  )
}
