import { useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { Character } from '../../types'
import { resizeImage } from '../../lib/utils'
import { useToast } from '../../context/toast'
import { Avatar } from '../../components/character/Avatar'

interface StepProps {
  character: Character
  onChange: (patch: Partial<Character>) => void
}

export function IdentityStep({ character, onChange }: StepProps) {
  const { notify } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setReading(true)
    try {
      const portrait = await resizeImage(file)
      onChange({ portrait })
      notify('Retrato adicionado.', 'success')
    } catch {
      notify('Não foi possível processar a imagem.', 'danger')
    } finally {
      setReading(false)
    }
  }

  return (
    <div className="stack">
      <div className="row" style={{ alignItems: 'flex-start', gap: 18 }}>
        <div className="stack-sm" style={{ alignItems: 'center' }}>
          <Avatar name={character.name} portrait={character.portrait} size="lg" />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
            aria-label="Enviar retrato"
          />
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => fileRef.current?.click()}
            disabled={reading}
          >
            <ImagePlus size={14} aria-hidden="true" />
            {reading ? 'Lendo...' : 'Retrato'}
          </button>
          {character.portrait ? (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => onChange({ portrait: undefined })}
            >
              <Trash2 size={13} aria-hidden="true" /> Remover
            </button>
          ) : null}
        </div>

        <div className="grow stack">
          <label className="field">
            <span>Nome do agente *</span>
            <input
              className="input"
              value={character.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Ex.: Helena Vasques"
              autoFocus
              required
            />
          </label>
          <div className="input-row">
            <label className="field">
              <span>Idade</span>
              <input
                className="input"
                value={character.age}
                onChange={(event) => onChange({ age: event.target.value })}
                placeholder="29"
              />
            </label>
            <label className="field">
              <span>Conceito</span>
              <input
                className="input"
                value={character.concept}
                onChange={(event) => onChange({ concept: event.target.value })}
                placeholder="Ex.: detetive relutante"
              />
            </label>
          </div>
        </div>
      </div>

      <label className="field">
        <span>Aparência</span>
        <textarea
          className="textarea"
          value={character.appearance}
          onChange={(event) => onChange({ appearance: event.target.value })}
          placeholder="Traços marcantes, cicatrizes, estilo de roupa..."
        />
      </label>
    </div>
  )
}
