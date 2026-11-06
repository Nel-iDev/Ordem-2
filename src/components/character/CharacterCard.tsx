import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Download, Trash2 } from 'lucide-react'
import type { Character } from '../../types'
import { PROFILE_BY_ID } from '../../data/profiles'
import { formatDate } from '../../lib/utils'
import { Avatar } from './Avatar'

interface CharacterCardProps {
  character: Character
  onDuplicate: (character: Character) => void
  onExport: (character: Character) => void
  onDelete: (character: Character) => void
}

export function CharacterCard({
  character,
  onDuplicate,
  onExport,
  onDelete,
}: CharacterCardProps) {
  const profile = PROFILE_BY_ID[character.profile]
  const style = { '--card-accent': profile?.accent ?? '#ff4d4d' } as CSSProperties

  return (
    <article className="character-card" style={style}>
      <div className="character-card-top">
        <Avatar name={character.name} portrait={character.portrait} />
        <div className="grow" style={{ minWidth: 0 }}>
          <Link to={`/ficha/${character.id}`} className="character-card-name">
            {character.name || 'Sem nome'}
          </Link>
          <p className="character-card-sub">
            {profile?.name ?? 'Perfil'} · {character.occupation}
          </p>
        </div>
      </div>

      <div className="character-card-stats">
        <div className="stat-mini">
          <span>Nível</span>
          <strong>{character.level}</strong>
        </div>
        <div className="stat-mini">
          <span>PV</span>
          <strong>
            {character.pv.current}/{character.pv.max}
          </strong>
        </div>
        <div className="stat-mini">
          <span>PD</span>
          <strong>
            {character.pd.current}/{character.pd.max}
          </strong>
        </div>
      </div>

      <div className="character-card-footer">
        <span className="small muted">{formatDate(character.updatedAt)}</span>
        <div className="card-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onDuplicate(character)}
            title="Duplicar ficha"
            aria-label={`Duplicar ${character.name || 'ficha'}`}
          >
            <Copy aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onExport(character)}
            title="Exportar JSON"
            aria-label={`Exportar ${character.name || 'ficha'}`}
          >
            <Download aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => onDelete(character)}
            title="Excluir ficha"
            aria-label={`Excluir ${character.name || 'ficha'}`}
          >
            <Trash2 aria-hidden="true" />
          </button>
          <Link
            to={`/ficha/${character.id}`}
            className="btn btn-sm"
            aria-label={`Abrir ficha de ${character.name || 'personagem'}`}
          >
            Abrir
          </Link>
        </div>
      </div>
    </article>
  )
}
