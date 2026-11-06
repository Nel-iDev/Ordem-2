import type { Character } from '../../types'

interface NotesPanelProps {
  character: Character
  onChange: (patch: Partial<Character>) => void
}

const FIELDS: Array<{
  key: 'appearance' | 'personality' | 'history' | 'notes'
  label: string
  placeholder: string
}> = [
  {
    key: 'appearance',
    label: 'Aparência',
    placeholder: 'Traços físicos, roupas, marcas...',
  },
  {
    key: 'personality',
    label: 'Personalidade',
    placeholder: 'Como o personagem age e pensa...',
  },
  {
    key: 'history',
    label: 'História',
    placeholder: 'De onde veio, o que viu, por que investiga...',
  },
  {
    key: 'notes',
    label: 'Anotações',
    placeholder: 'Pistas, contatos, objetivos...',
  },
]

export function NotesPanel({ character, onChange }: NotesPanelProps) {
  return (
    <div className="notes-grid">
      {FIELDS.map((field) => (
        <label className="field" key={field.key}>
          <span>{field.label}</span>
          <textarea
            className="textarea"
            value={character[field.key]}
            placeholder={field.placeholder}
            onChange={(event) => onChange({ [field.key]: event.target.value })}
          />
        </label>
      ))}
    </div>
  )
}
