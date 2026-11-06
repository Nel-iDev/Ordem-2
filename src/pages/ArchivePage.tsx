import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  Download,
  FolderOpen,
  Plus,
  Search,
  Upload,
  UserPlus,
} from 'lucide-react'
import type { Character } from '../types'
import { PROFILE_BY_ID } from '../data/profiles'
import { downloadJson, slugify } from '../lib/utils'
import { useCharacters } from '../context/characters'
import { useToast } from '../context/toast'
import { CharacterCard } from '../components/character/CharacterCard'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type SortMode = 'recent' | 'name' | 'level'

export function ArchivePage() {
  const { characters, duplicate, remove, importFromText, exportAll } = useCharacters()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('recent')
  const [pendingDelete, setPendingDelete] = useState<Character | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = term
      ? characters.filter((character) => {
          const profile = PROFILE_BY_ID[character.profile]?.name ?? ''
          return `${character.name} ${character.occupation} ${profile} ${character.concept}`
            .toLowerCase()
            .includes(term)
        })
      : characters

    return [...list].sort((a, b) => {
      if (sort === 'name') {
        return (a.name || 'Sem nome').localeCompare(b.name || 'Sem nome', 'pt-BR')
      }
      if (sort === 'level') return b.level - a.level
      return b.updatedAt - a.updatedAt
    })
  }, [characters, query, sort])

  const profilesUsed = useMemo(
    () => new Set(characters.map((character) => character.profile)).size,
    [characters],
  )

  const handleExport = (character: Character) => {
    downloadJson(character, `${slugify(character.name || 'ficha')}.json`)
    notify('Ficha exportada em JSON.', 'success')
  }

  const handleDuplicate = (character: Character) => {
    try {
      const copy = duplicate(character)
      notify(`Cópia criada: ${copy.name}.`, 'success')
    } catch {
      notify('Não foi possível duplicar a ficha neste navegador.', 'danger')
    }
  }

  const handleDelete = () => {
    if (!pendingDelete) return
    try {
      remove(pendingDelete.id)
      notify('Ficha excluída.', 'info')
      setPendingDelete(null)
    } catch {
      notify('Não foi possível excluir a ficha.', 'danger')
    }
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const count = importFromText(text)
      notify(
        count === 1 ? 'Ficha importada com sucesso.' : `${count} fichas importadas com sucesso.`,
        'success',
      )
    } catch {
      notify('Não foi possível importar o arquivo. Verifique se é um JSON de ficha válido.', 'danger')
    }
  }

  return (
    <div className="container">
      <section className="archive-hero">
        <span className="eyebrow">Dossiê de campo · uso restrito</span>
        <h1>
          Arquivo de <span style={{ color: 'var(--accent)' }}>agentes</span>
        </h1>
        <p>
          Fichas, perícias e rolagens do seu RPG de investigação paranormal. Tudo salvo localmente
          no navegador — sem contas, sem servidores.
        </p>
        <div className="archive-hero-actions">
          <Link to="/nova" className="btn btn-primary btn-lg">
            <Plus size={17} aria-hidden="true" /> Criar ficha
          </Link>
          <button type="button" className="btn btn-lg" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden="true" /> Importar JSON
          </button>
          <button
            type="button"
            className="btn btn-lg btn-ghost"
            onClick={exportAll}
            disabled={!characters.length}
          >
            <Download size={16} aria-hidden="true" /> Exportar tudo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFile}
            className="sr-only"
            aria-label="Importar fichas em JSON"
          />
        </div>
        <div className="archive-meta">
          <span>
            <strong>{characters.length}</strong> ficha{characters.length === 1 ? '' : 's'}
          </span>
          <span>
            <strong>{profilesUsed}</strong> perfil{profilesUsed === 1 ? '' : 's'} em uso
          </span>
          <span>Armazenamento local do navegador</span>
        </div>
      </section>

      {characters.length ? (
        <>
          <div className="page-head" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="page-title" style={{ fontSize: '1.35rem' }}>
                Fichas registradas
              </h2>
            </div>
            <div className="toolbar">
              <div className="search">
                <Search aria-hidden="true" />
                <input
                  className="input"
                  type="search"
                  placeholder="Buscar por nome, perfil ou ocupação..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Buscar fichas"
                />
              </div>
              <select
                className="select"
                style={{ width: 'auto' }}
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                aria-label="Ordenar fichas"
              >
                <option value="recent">Mais recentes</option>
                <option value="name">Nome (A–Z)</option>
                <option value="level">Maior nível</option>
              </select>
            </div>
          </div>

          {filtered.length ? (
            <div className="archive-grid">
              {filtered.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onDuplicate={handleDuplicate}
                  onExport={handleExport}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FolderOpen aria-hidden="true" />
              </div>
              <h2>Nenhuma ficha encontrada</h2>
              <p>Não há resultados para “{query}”. Tente outro termo de busca.</p>
              <button type="button" className="btn" onClick={() => setQuery('')}>
                Limpar busca
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Archive aria-hidden="true" />
          </div>
          <h2>O arquivo está vazio</h2>
          <p>
            Crie seu primeiro agente para começar a registrar atributos, perícias e rolagens. Você
            também pode importar uma ficha em JSON.
          </p>
          <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/nova" className="btn btn-primary">
              <UserPlus size={16} aria-hidden="true" /> Criar primeira ficha
            </Link>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              <Upload size={16} aria-hidden="true" /> Importar JSON
            </button>
          </div>
        </div>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title="Excluir ficha"
          message={`A ficha de “${pendingDelete.name || 'Agente'}” e o histórico de rolagens serão apagados. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir ficha"
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  )
}
