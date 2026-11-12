import { describe, expect, it } from 'vitest'
import type { CampaignSession } from '../types'
import {
  addCharacterToCampaign,
  addSession,
  createCampaign,
  createSession,
  formatSessionDate,
  latestSession,
  normalizeCampaign,
  patchCampaign,
  removeCharacterFromCampaign,
  removeSession,
  sortSessions,
  updateSession,
} from './campaigns'

function makeSession(overrides: Partial<CampaignSession> = {}): CampaignSession {
  return {
    id: 'session-1',
    title: 'Sessão',
    date: '2026-01-10',
    summary: '',
    notes: '',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

describe('campanhas', () => {
  it('cria campanhas com valores padrão', () => {
    const campaign = createCampaign('  Operação Véu Negro  ')

    expect(campaign.name).toBe('Operação Véu Negro')
    expect(campaign.status).toBe('ativa')
    expect(campaign.characterIds).toEqual([])
    expect(campaign.sessions).toEqual([])
    expect(campaign.description).toBe('')
  })

  it('normaliza campanhas incompletas e remove ids repetidos', () => {
    const campaign = normalizeCampaign({
      name: 'Mesa',
      status: 'invalido' as never,
      characterIds: ['a', 'a', '', 'b'],
      sessions: [
        makeSession({ id: 's1' }),
        makeSession({ id: 's1' }),
        null as never,
      ],
    })

    expect(campaign.name).toBe('Mesa')
    expect(campaign.status).toBe('ativa')
    expect(campaign.characterIds).toEqual(['a', 'b'])
    expect(campaign.sessions).toHaveLength(1)
  })

  it('normaliza sessões com data inválida e título vazio', () => {
    const campaign = normalizeCampaign({
      sessions: [
        {
          id: 's1',
          title: '   ',
          date: '10/01/2026',
          summary: 'Resumo',
          notes: 'Notas',
          createdAt: 1000,
          updatedAt: 1000,
        },
      ],
    })

    expect(campaign.sessions[0]?.title).toBe('Sessão sem título')
    expect(campaign.sessions[0]?.date).toBe('')
    expect(campaign.sessions[0]?.summary).toBe('Resumo')
  })

  it('atualiza dados da campanha mantendo id e vínculos', () => {
    const campaign = addCharacterToCampaign(createCampaign('Mesa'), 'char-1')
    const updated = patchCampaign(campaign, {
      name: 'Mesa nova',
      description: 'Descrição',
      status: 'pausada',
    })

    expect(updated.id).toBe(campaign.id)
    expect(updated.name).toBe('Mesa nova')
    expect(updated.description).toBe('Descrição')
    expect(updated.status).toBe('pausada')
    expect(updated.characterIds).toEqual(['char-1'])
  })

  it('adiciona e remove personagens sem duplicar vínculos', () => {
    const campaign = createCampaign('Mesa')

    const added = addCharacterToCampaign(campaign, 'char-1')
    expect(added.characterIds).toEqual(['char-1'])
    expect(addCharacterToCampaign(added, 'char-1')).toBe(added)

    const removed = removeCharacterFromCampaign(added, 'char-1')
    expect(removed.characterIds).toEqual([])
    expect(removeCharacterFromCampaign(removed, 'char-1')).toBe(removed)
  })

  it('adiciona, atualiza e remove sessões', () => {
    const campaign = createCampaign('Mesa')
    const session = createSession({
      title: 'O casarão',
      date: '2026-02-03',
      summary: 'Investigação',
      notes: 'Pistas',
    })

    const withSession = addSession(campaign, session)
    expect(withSession.sessions).toHaveLength(1)
    expect(withSession.sessions[0]?.title).toBe('O casarão')

    const updated = updateSession(withSession, session.id, {
      title: 'O casarão abandonado',
      date: '2026-02-04',
    })
    expect(updated.sessions[0]?.title).toBe('O casarão abandonado')
    expect(updated.sessions[0]?.date).toBe('2026-02-04')
    expect(updated.sessions[0]?.summary).toBe('Investigação')

    const removed = removeSession(updated, session.id)
    expect(removed.sessions).toEqual([])
  })

  it('ordena sessões da mais recente para a mais antiga', () => {
    const sessions = [
      makeSession({ id: 'old', date: '2026-01-01', createdAt: 1 }),
      makeSession({ id: 'new', date: '2026-03-01', createdAt: 2 }),
      makeSession({ id: 'tie-newer', date: '2026-02-01', createdAt: 30 }),
      makeSession({ id: 'tie-older', date: '2026-02-01', createdAt: 10 }),
      makeSession({ id: 'no-date', date: '', createdAt: 99 }),
    ]

    expect(sortSessions(sessions).map((session) => session.id)).toEqual([
      'new',
      'tie-newer',
      'tie-older',
      'old',
      'no-date',
    ])
    expect(latestSession({ ...createCampaign(), sessions })?.id).toBe('new')
  })

  it('formata datas de sessão para o padrão brasileiro', () => {
    expect(formatSessionDate('2026-03-09')).toBe('09/03/2026')
    expect(formatSessionDate('')).toBe('Sem data')
    expect(formatSessionDate('data livre')).toBe('data livre')
  })

  it('usa a data de hoje como padrão de nova sessão', () => {
    const session = createSession({ title: 'Sessão' })
    expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(session.title).toBe('Sessão')
  })
})
