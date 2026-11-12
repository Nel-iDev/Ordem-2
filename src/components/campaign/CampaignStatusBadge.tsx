import type { CampaignStatus } from '../../types'
import { CAMPAIGN_STATUS_LABEL } from '../../lib/campaigns'

const TONE: Record<CampaignStatus, string> = {
  ativa: 'badge-ok',
  pausada: 'badge-warn',
  encerrada: '',
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`badge ${TONE[status]}`.trim()}>
      {CAMPAIGN_STATUS_LABEL[status]}
    </span>
  )
}
