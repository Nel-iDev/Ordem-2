import { useId, useState, type FormEvent } from 'react'
import type { CampaignStatus } from '../../types'
import { CAMPAIGN_STATUSES, CAMPAIGN_STATUS_LABEL } from '../../lib/campaigns'
import { Modal } from '../ui/Modal'

export interface CampaignFormValues {
  name: string
  description: string
  status: CampaignStatus
}

interface CampaignFormDialogProps {
  title: string
  submitLabel: string
  initial?: CampaignFormValues
  onSubmit: (values: CampaignFormValues) => void
  onClose: () => void
}

const DEFAULT_VALUES: CampaignFormValues = {
  name: '',
  description: '',
  status: 'ativa',
}

export function CampaignFormDialog({
  title,
  submitLabel,
  initial = DEFAULT_VALUES,
  onSubmit,
  onClose,
}: CampaignFormDialogProps) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [status, setStatus] = useState<CampaignStatus>(initial.status)
  const [error, setError] = useState('')
  const errorId = useId()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Dê um nome à campanha.')
      return
    }
    onSubmit({ name: trimmed, description: description.trim(), status })
  }

  return (
    <Modal
      title={title}
      description="Campanhas organizam agentes, sessões e anotações da mesa."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="campaign-form" className="btn btn-primary">
            {submitLabel}
          </button>
        </>
      }
    >
      <form id="campaign-form" className="stack-sm" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome</span>
          <input
            className="input"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            placeholder="Ex.: Operação Véu Negro"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select
            className="select"
            value={status}
            onChange={(event) => setStatus(event.target.value as CampaignStatus)}
          >
            {CAMPAIGN_STATUSES.map((entry) => (
              <option key={entry} value={entry}>
                {CAMPAIGN_STATUS_LABEL[entry]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Descrição</span>
          <textarea
            className="textarea"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Premissa, tom, objetivos e o que a mesa precisa lembrar."
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
