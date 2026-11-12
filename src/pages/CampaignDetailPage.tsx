import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ExternalLink,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import type { Campaign, CampaignSession } from '../types'
import {
  addCharacterToCampaign,
  addSession,
  createSession,
  formatSessionDate,
  patchCampaign,
  removeCharacterFromCampaign,
  removeSession,
  sortSessions,
  updateSession,
} from '../lib/campaigns'
import { deleteCampaign, getCampaign, upsertCampaign } from '../lib/storage'
import { formatDate } from '../lib/utils'
import { PROFILE_BY_ID } from '../data/profiles'
import { useCharacters } from '../context/characters'
import { useToast } from '../context/toast'
import { Avatar } from '../components/character/Avatar'
import {
  CampaignFormDialog,
  type CampaignFormValues,
} from '../components/campaign/CampaignFormDialog'
import { CampaignStatusBadge } from '../components/campaign/CampaignStatusBadge'
import {
  SessionFormDialog,
  type SessionFormValues,
} from '../components/campaign/SessionFormDialog'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

export function CampaignDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { characters } = useCharacters()
  const { notify } = useToast()
  const [campaign, setCampaign] = useState<Campaign | null>(() =>
    id ? (getCampaign(id) ?? null) : null,
  )
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [editing, setEditing] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)
  const [editingSession, setEditingSession] = useState<CampaignSession | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [pendingSessionDelete, setPendingSessionDelete] =
    useState<CampaignSession | null>(null)

  const refresh = () => {
    if (!id) return
    setCampaign(getCampaign(id) ?? null)
  }

  const persist = (next: Campaign): boolean => {
    try {
      upsertCampaign(next)
      refresh()
      return true
    } catch {
      notify('Não foi possível salvar a campanha neste navegador.', 'danger')
      return false
    }
  }

  if (!campaign) {
    return (
      <div className="container">
        <Link to="/campanhas" className="campaign-back">
          <ArrowLeft size={15} aria-hidden="true" /> Voltar para campanhas
        </Link>
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen aria-hidden="true" />
          </div>
          <h1 className="empty-state-title">Campanha não encontrada</h1>
          <p>Ela pode ter sido excluída ou o endereço está incorreto.</p>
          <Link to="/campanhas" className="btn btn-primary">
            Ver campanhas
          </Link>
        </div>
      </div>
    )
  }

  const roster = campaign.characterIds.map((characterId) => ({
    characterId,
    character: characters.find((entry) => entry.id === characterId),
  }))
  const availableCharacters = characters.filter(
    (character) => !campaign.characterIds.includes(character.id),
  )
  const sessions = sortSessions(campaign.sessions)
  const lastSession = sessions[0]

  const handleEdit = (values: CampaignFormValues) => {
    if (!persist(patchCampaign(campaign, values))) return
    setEditing(false)
    notify('Campanha atualizada.', 'success')
  }

  const handleDelete = () => {
    try {
      deleteCampaign(campaign.id)
      notify('Campanha excluída. As fichas dos agentes foram mantidas.', 'info')
      navigate('/campanhas')
    } catch {
      notify('Não foi possível excluir a campanha.', 'danger')
    }
  }

  const handleAddCharacter = () => {
    if (!selectedCharacterId) return
    const character = characters.find((entry) => entry.id === selectedCharacterId)
    if (!persist(addCharacterToCampaign(campaign, selectedCharacterId))) return
    setSelectedCharacterId('')
    notify(
      `${character?.name.trim() || 'Agente'} vinculado à campanha.`,
      'success',
    )
  }

  const handleRemoveCharacter = (characterId: string) => {
    if (!persist(removeCharacterFromCampaign(campaign, characterId))) return
    notify('Agente desvinculado da campanha. A ficha foi mantida.', 'info')
  }

  const handleCreateSession = (values: SessionFormValues) => {
    if (!persist(addSession(campaign, createSession(values)))) return
    setCreatingSession(false)
    notify('Sessão registrada.', 'success')
  }

  const handleEditSession = (values: SessionFormValues) => {
    if (!editingSession) return
    if (!persist(updateSession(campaign, editingSession.id, values))) return
    setEditingSession(null)
    notify('Sessão atualizada.', 'success')
  }

  const handleDeleteSession = () => {
    if (!pendingSessionDelete) return
    if (!persist(removeSession(campaign, pendingSessionDelete.id))) return
    setPendingSessionDelete(null)
    notify('Sessão excluída.', 'info')
  }

  return (
    <div className="container campaign-detail">
      <div>
        <Link to="/campanhas" className="campaign-back">
          <ArrowLeft size={15} aria-hidden="true" /> Voltar para campanhas
        </Link>

        <section className="campaign-detail-head">
          <div>
            <span className="eyebrow">Campanha</span>
            <div className="campaign-detail-title-row">
              <h1 className="page-title">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="campaign-detail-desc">
              {campaign.description || 'Sem descrição registrada.'}
            </p>
          </div>
          <div className="campaign-detail-actions">
            <button type="button" className="btn" onClick={() => setEditing(true)}>
              <Pencil size={15} aria-hidden="true" /> Editar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setPendingDelete(true)}
            >
              <Trash2 size={15} aria-hidden="true" /> Excluir
            </button>
          </div>
        </section>

        <div className="campaign-meta">
          <span>
            <Users aria-hidden="true" /> {campaign.characterIds.length} agente
            {campaign.characterIds.length === 1 ? '' : 's'}
          </span>
          <span>
            <BookOpen aria-hidden="true" /> {campaign.sessions.length}{' '}
            {campaign.sessions.length === 1 ? 'sessão' : 'sessões'}
          </span>
          <span>
            <CalendarDays aria-hidden="true" />{' '}
            {lastSession
              ? `Última sessão em ${formatSessionDate(lastSession.date)}`
              : 'Nenhuma sessão registrada'}
          </span>
          <span>Criada em {formatDate(campaign.createdAt)}</span>
        </div>
      </div>

      <div className="campaign-detail-grid">
        <section className="panel">
          <div className="panel-head campaign-session-head">
            <span className="panel-title">
              <NotebookPen size={15} aria-hidden="true" /> Diário de sessões
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setCreatingSession(true)}
            >
              <Plus size={14} aria-hidden="true" /> Nova sessão
            </button>
          </div>
          <div className="panel-body">
            {sessions.length ? (
              <ol className="session-list">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="session-item"
                    aria-labelledby={`session-title-${session.id}`}
                  >
                    <div className="session-head">
                      <div>
                        <h2
                          id={`session-title-${session.id}`}
                          className="session-title"
                        >
                          {session.title}
                        </h2>
                        <time
                          className="session-date"
                          dateTime={session.date || undefined}
                        >
                          <CalendarDays size={13} aria-hidden="true" />
                          {formatSessionDate(session.date)}
                        </time>
                      </div>
                      <div className="session-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setEditingSession(session)}
                          aria-label={`Editar sessão ${session.title}`}
                          title="Editar sessão"
                        >
                          <Pencil aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => setPendingSessionDelete(session)}
                          aria-label={`Excluir sessão ${session.title}`}
                          title="Excluir sessão"
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {session.summary ? (
                      <p className="session-summary">{session.summary}</p>
                    ) : null}
                    {session.notes ? (
                      <p className="session-notes">{session.notes}</p>
                    ) : null}
                    {!session.summary && !session.notes ? (
                      <p className="small muted session-summary">
                        Sem resumo ou anotações.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="session-empty">
                <NotebookPen aria-hidden="true" />
                <h2>Nenhuma sessão registrada</h2>
                <p>
                  Registre o que o grupo descobriu, enfrentou ou decidiu para manter a
                  crônica da mesa.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setCreatingSession(true)}
                >
                  <Plus size={14} aria-hidden="true" /> Registrar primeira sessão
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="campaign-side">
          <section className="panel">
            <div className="panel-head">
              <span className="panel-title">
                <Users size={15} aria-hidden="true" /> Elenco
              </span>
            </div>
            <div className="panel-body">
              {roster.length ? (
                <ul className="campaign-roster">
                  {roster.map(({ characterId, character }) => (
                    <li key={characterId} className="campaign-roster-item">
                      {character ? (
                        <>
                          <Avatar
                            name={character.name}
                            portrait={character.portrait}
                            size="sm"
                          />
                          <div className="grow">
                            <Link
                              to={`/ficha/${character.id}`}
                              className="campaign-roster-name"
                            >
                              {character.name.trim() || 'Agente sem nome'}
                            </Link>
                            <span className="campaign-roster-sub">
                              {PROFILE_BY_ID[character.profile]?.name ?? 'Agente'} · Nível{' '}
                              {character.level}
                            </span>
                          </div>
                          <Link
                            to={`/ficha/${character.id}`}
                            className="icon-btn"
                            aria-label={`Abrir ficha de ${character.name}`}
                            title="Abrir ficha"
                          >
                            <ExternalLink aria-hidden="true" />
                          </Link>
                        </>
                      ) : (
                        <div className="campaign-roster-missing grow">
                          <strong>Ficha removida</strong>
                          <span className="campaign-roster-sub">
                            O vínculo aponta para uma ficha que não existe mais.
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => handleRemoveCharacter(characterId)}
                        aria-label={`Desvincular ${character?.name ?? 'ficha removida'}`}
                        title="Desvincular da campanha"
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small muted">
                  Nenhum agente vinculado. Adicione fichas do arquivo para montar o elenco.
                </p>
              )}

              <div className="campaign-roster-add">
                {availableCharacters.length ? (
                  <>
                    <select
                      className="select"
                      value={selectedCharacterId}
                      onChange={(event) => setSelectedCharacterId(event.target.value)}
                      aria-label="Agente para vincular"
                    >
                      <option value="">Selecione um agente…</option>
                      {availableCharacters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name.trim() || 'Agente sem nome'}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={!selectedCharacterId}
                      onClick={handleAddCharacter}
                    >
                      <Plus size={14} aria-hidden="true" /> Vincular
                    </button>
                  </>
                ) : (
                  <p className="small muted">
                    {characters.length
                      ? 'Todos os agentes do arquivo já estão nesta campanha.'
                      : 'Nenhum agente no arquivo. Crie uma ficha primeiro.'}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <span className="panel-title">
                <BookOpen size={15} aria-hidden="true" /> Ficha da campanha
              </span>
            </div>
            <div className="panel-body">
              <div className="campaign-facts">
                <div>
                  <span>Status</span>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
                <div>
                  <span>Sessões</span>
                  <strong>{campaign.sessions.length}</strong>
                </div>
                <div>
                  <span>Agentes</span>
                  <strong>{campaign.characterIds.length}</strong>
                </div>
                <div>
                  <span>Atualizada</span>
                  <strong>{formatDate(campaign.updatedAt)}</strong>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {editing ? (
        <CampaignFormDialog
          title="Editar campanha"
          submitLabel="Salvar alterações"
          initial={{
            name: campaign.name,
            description: campaign.description,
            status: campaign.status,
          }}
          onSubmit={handleEdit}
          onClose={() => setEditing(false)}
        />
      ) : null}

      {creatingSession ? (
        <SessionFormDialog
          title="Nova sessão"
          submitLabel="Registrar sessão"
          onSubmit={handleCreateSession}
          onClose={() => setCreatingSession(false)}
        />
      ) : null}

      {editingSession ? (
        <SessionFormDialog
          title="Editar sessão"
          submitLabel="Salvar alterações"
          initial={{
            title: editingSession.title,
            date: editingSession.date,
            summary: editingSession.summary,
            notes: editingSession.notes,
          }}
          onSubmit={handleEditSession}
          onClose={() => setEditingSession(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Excluir campanha"
          message={`A campanha “${campaign.name}” e o registro das sessões serão apagados. As fichas dos agentes continuam no arquivo. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir campanha"
          onCancel={() => setPendingDelete(false)}
          onConfirm={handleDelete}
        />
      ) : null}

      {pendingSessionDelete ? (
        <ConfirmDialog
          title="Excluir sessão"
          message={`A sessão “${pendingSessionDelete.title}” será removida do diário. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir sessão"
          onCancel={() => setPendingSessionDelete(null)}
          onConfirm={handleDeleteSession}
        />
      ) : null}
    </div>
  )
}
