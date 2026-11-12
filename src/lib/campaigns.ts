import type { Campaign, CampaignSession, CampaignStatus } from '../types'
import { createId } from './character'

/**
 * Regras de campanhas e sessões. O módulo é puro: recebe a campanha e devolve
 * uma campanha nova, sem tocar no armazenamento ou em fichas de personagem.
 */

export const CAMPAIGN_STATUSES: CampaignStatus[] = ['ativa', 'pausada', 'encerrada']

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
}

export function isCampaignStatus(value: unknown): value is CampaignStatus {
  return value === 'ativa' || value === 'pausada' || value === 'encerrada'
}

/** Data local no formato aceito por `<input type="date">`. */
export function todayIsoDate(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function normalizeDate(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : ''
}

function normalizeSession(input: unknown): CampaignSession | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Partial<CampaignSession>
  const now = Date.now()
  const createdAt = Number.isFinite(raw.createdAt) ? Number(raw.createdAt) : now
  const updatedAt = Number.isFinite(raw.updatedAt) ? Number(raw.updatedAt) : createdAt

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    title:
      typeof raw.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : 'Sessão sem título',
    date: normalizeDate(raw.date),
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    createdAt,
    updatedAt,
  }
}

export function createCampaign(name = 'Nova campanha'): Campaign {
  const now = Date.now()
  return {
    id: createId(),
    name: name.trim() || 'Nova campanha',
    description: '',
    status: 'ativa',
    characterIds: [],
    sessions: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeCampaign(input: Partial<Campaign>): Campaign {
  const base = createCampaign()
  const rawSessions = Array.isArray(input.sessions) ? input.sessions : []
  const seenSessions = new Set<string>()
  const sessions: CampaignSession[] = []

  for (const entry of rawSessions) {
    const session = normalizeSession(entry)
    if (!session || seenSessions.has(session.id)) continue
    seenSessions.add(session.id)
    sessions.push(session)
  }

  const characterIds = Array.isArray(input.characterIds)
    ? [
        ...new Set(
          input.characterIds.filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          ),
        ),
      ]
    : []

  return {
    id: typeof input.id === 'string' && input.id ? input.id : base.id,
    name:
      typeof input.name === 'string' && input.name.trim()
        ? input.name.trim()
        : base.name,
    description: typeof input.description === 'string' ? input.description : '',
    status: isCampaignStatus(input.status) ? input.status : 'ativa',
    characterIds,
    sessions,
    createdAt: Number.isFinite(input.createdAt) ? Number(input.createdAt) : Date.now(),
    updatedAt: Number.isFinite(input.updatedAt) ? Number(input.updatedAt) : Date.now(),
  }
}

export function createSession(
  input: Partial<Pick<CampaignSession, 'title' | 'date' | 'summary' | 'notes'>> = {},
): CampaignSession {
  const now = Date.now()
  return {
    id: createId(),
    title: input.title?.trim() || 'Nova sessão',
    date: normalizeDate(input.date ?? todayIsoDate()),
    summary: input.summary ?? '',
    notes: input.notes ?? '',
    createdAt: now,
    updatedAt: now,
  }
}

export type CampaignPatch = Partial<Pick<Campaign, 'name' | 'description' | 'status'>>

export function patchCampaign(campaign: Campaign, patch: CampaignPatch): Campaign {
  return normalizeCampaign({
    ...campaign,
    ...patch,
    id: campaign.id,
    updatedAt: Date.now(),
  })
}

export function addCharacterToCampaign(
  campaign: Campaign,
  characterId: string,
): Campaign {
  if (!characterId || campaign.characterIds.includes(characterId)) return campaign
  return {
    ...campaign,
    characterIds: [...campaign.characterIds, characterId],
    updatedAt: Date.now(),
  }
}

export function removeCharacterFromCampaign(
  campaign: Campaign,
  characterId: string,
): Campaign {
  if (!campaign.characterIds.includes(characterId)) return campaign
  return {
    ...campaign,
    characterIds: campaign.characterIds.filter((id) => id !== characterId),
    updatedAt: Date.now(),
  }
}

export function addSession(campaign: Campaign, session: CampaignSession): Campaign {
  return {
    ...campaign,
    sessions: [session, ...campaign.sessions],
    updatedAt: Date.now(),
  }
}

export type SessionPatch = Partial<
  Pick<CampaignSession, 'title' | 'date' | 'summary' | 'notes'>
>

export function updateSession(
  campaign: Campaign,
  sessionId: string,
  patch: SessionPatch,
): Campaign {
  return {
    ...campaign,
    sessions: campaign.sessions.map((session) => {
      if (session.id !== sessionId) return session
      const updated = normalizeSession({
        ...session,
        ...patch,
        id: session.id,
        createdAt: session.createdAt,
        updatedAt: Date.now(),
      })
      return updated ?? session
    }),
    updatedAt: Date.now(),
  }
}

export function removeSession(campaign: Campaign, sessionId: string): Campaign {
  return {
    ...campaign,
    sessions: campaign.sessions.filter((session) => session.id !== sessionId),
    updatedAt: Date.now(),
  }
}

function sessionTimestamp(session: CampaignSession): number {
  const parsed = Date.parse(`${session.date}T00:00:00`)
  return Number.isFinite(parsed) ? parsed : session.createdAt
}

/** Sessões mais recentes primeiro; datas ausentes caem para a data de criação. */
export function sortSessions(sessions: CampaignSession[]): CampaignSession[] {
  return [...sessions].sort(
    (first, second) =>
      sessionTimestamp(second) - sessionTimestamp(first) ||
      second.createdAt - first.createdAt,
  )
}

export function latestSession(campaign: Campaign): CampaignSession | undefined {
  return sortSessions(campaign.sessions)[0]
}

export function formatSessionDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return date || 'Sem data'
  return `${match[3]}/${match[2]}/${match[1]}`
}
