import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import type { Campaign, CampaignStatus } from '../types'
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABEL,
  createCampaign,
  formatSessionDate,
  latestSession,
  patchCampaign,
} from '../lib/campaigns'
import { deleteCampaign, loadCampaigns, upsertCampaign } from '../lib/storage'
import { formatDate } from '../lib/utils'
import { useToast } from '../context/toast'
import {
  CampaignFormDialog,
  type CampaignFormValues,
} from '../components/campaign/CampaignFormDialog'
import { CampaignStatusBadge } from '../components/campaign/CampaignStatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type StatusFilter = 'todas' | CampaignStatus

export function CampaignsPage() {
  const { notify } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadCampaigns())
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todas')
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return campaigns.filter((campaign) => {
      const matchesStatus = status === 'todas' || campaign.status === status
      if (!matchesStatus) return false
      if (!term) return true
      return `${campaign.name} ${campaign.description}`.toLowerCase().includes(term)
    })
  }, [campaigns, query, status])

  const activeCount = campaigns.filter((campaign) => campaign.status === 'ativa').length
  const sessionCount = campaigns.reduce(
    (total, campaign) => total + campaign.sessions.length,
    0,
  )

  const handleCreate = (values: CampaignFormValues) => {
    const campaign = patchCampaign(createCampaign(values.name), values)
    try {
      upsertCampaign(campaign)
      setCampaigns(loadCampaigns())
      setCreating(false)
      notify('Campanha criada.', 'success')
    } catch {
      notify('Não foi possível salvar a campanha neste navegador.', 'danger')
    }
  }

  const handleDelete = () => {
    if (!pendingDelete) return
    try {
      deleteCampaign(pendingDelete.id)
      setCampaigns(loadCampaigns())
      setPendingDelete(null)
      notify('Campanha excluída. As fichas dos agentes foram mantidas.', 'info')
    } catch {
      notify('Não foi possível excluir a campanha.', 'danger')
    }
  }

  return (
    <div className="container campaign-page">
      <section className="archive-hero">
        <span className="eyebrow">Ordem 2 · mesas e crônicas</span>
        <h1>
          Campanhas & <span style={{ color: 'var(--accent)' }}>sessões</span>
        </h1>
        <p>
          Reúna agentes, acompanhe o status da mesa e registre o que aconteceu em cada
          sessão. As fichas continuam vivas no arquivo: a campanha guarda apenas os
          vínculos.
        </p>
        <div className="archive-hero-actions">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setCreating(true)}
          >
            <Plus size={17} aria-hidden="true" /> Nova campanha
          </button>
        </div>
        <div className="archive-meta">
          <span>
            <strong>{campaigns.length}</strong> campanha
            {campaigns.length === 1 ? '' : 's'}
          </span>
          <span>
            <strong>{activeCount}</strong> ativa{activeCount === 1 ? '' : 's'}
          </span>
          <span>
            <strong>{sessionCount}</strong> {sessionCount === 1 ? 'sessão' : 'sessões'}{' '}
            registrada{sessionCount === 1 ? '' : 's'}
          </span>
          <span>Vínculos com as fichas do arquivo</span>
        </div>
      </section>

      {campaigns.length ? (
        <>
          <div className="page-head" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="page-title" style={{ fontSize: '1.35rem' }}>
                Suas campanhas
              </h2>
            </div>
            <div className="toolbar">
              <div className="search">
                <Search aria-hidden="true" />
                <input
                  className="input"
                  type="search"
                  placeholder="Buscar por nome ou descrição..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Buscar campanhas"
                />
              </div>
              <select
                className="select"
                style={{ width: 'auto' }}
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                aria-label="Filtrar por status"
              >
                <option value="todas">Todos os status</option>
                {CAMPAIGN_STATUSES.map((entry) => (
                  <option key={entry} value={entry}>
                    {CAMPAIGN_STATUS_LABEL[entry]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length ? (
            <div className="campaign-grid">
              {filtered.map((campaign) => {
                const lastSession = latestSession(campaign)
                return (
                  <article key={campaign.id} className="campaign-card">
                    <div className="campaign-card-head">
                      <div>
                        <Link to={`/campanhas/${campaign.id}`} className="campaign-card-title">
                          {campaign.name}
                        </Link>
                        <p className="campaign-card-desc">
                          {campaign.description || 'Sem descrição registrada.'}
                        </p>
                      </div>
                      <CampaignStatusBadge status={campaign.status} />
                    </div>

                    <div className="campaign-card-meta">
                      <span>
                        <Users aria-hidden="true" /> {campaign.characterIds.length} agente
                        {campaign.characterIds.length === 1 ? '' : 's'}
                      </span>
                      <span>
                        <BookOpen aria-hidden="true" /> {campaign.sessions.length}{' '}
                        {campaign.sessions.length === 1 ? 'sessão' : 'sessões'}
                      </span>
                    </div>

                    <div className="campaign-card-footer">
                      <span>
                        {lastSession
                          ? `Última sessão: ${formatSessionDate(lastSession.date)}`
                          : `Atualizada em ${formatDate(campaign.updatedAt)}`}
                      </span>
                      <div className="campaign-card-actions">
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => setPendingDelete(campaign)}
                          aria-label={`Excluir campanha ${campaign.name}`}
                          title="Excluir campanha"
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                        <Link
                          to={`/campanhas/${campaign.id}`}
                          className="campaign-open-link"
                          aria-label={`Abrir campanha ${campaign.name}`}
                        >
                          Abrir <ChevronRight size={14} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FolderOpen aria-hidden="true" />
              </div>
              <h2>Nenhuma campanha encontrada</h2>
              <p>Não há resultados para os filtros atuais. Ajuste a busca ou o status.</p>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setQuery('')
                  setStatus('todas')
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen aria-hidden="true" />
          </div>
          <h2>Nenhuma campanha registrada</h2>
          <p>
            Crie uma campanha para reunir agentes e manter um diário de sessões. Você pode
            começar com uma mesa ativa e adicionar as fichas depois.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden="true" /> Criar primeira campanha
          </button>
        </div>
      )}

      {creating ? (
        <CampaignFormDialog
          title="Nova campanha"
          submitLabel="Criar campanha"
          onSubmit={handleCreate}
          onClose={() => setCreating(false)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Excluir campanha"
          message={`A campanha “${pendingDelete.name}” e o registro das sessões serão apagados. As fichas dos agentes continuam no arquivo. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir campanha"
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  )
}
