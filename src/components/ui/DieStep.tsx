import { Minus, Plus } from 'lucide-react'
import { DIE_ORDER } from '../../lib/dice'
import type { Die } from '../../types'
import { DieIcon } from '../DieIcon'

interface DieStepProps {
  die: Die
  onChange: (die: Die) => void
  allowD20?: boolean
  label?: string
  disabled?: boolean
}

export function DieStep({ die, onChange, allowD20 = false, label, disabled }: DieStepProps) {
  const order = allowD20 ? [...DIE_ORDER, 'd20' as Die] : DIE_ORDER
  const index = Math.max(0, order.indexOf(die))
  const canDown = index > 0 && !disabled
  const canUp = index < order.length - 1 && !disabled
  const name = label ? `${label}: dado ${die}` : `Dado ${die}`

  return (
    <div className="stepper" role="group" aria-label={name}>
      <button
        type="button"
        onClick={() => onChange(order[index - 1] ?? 'd4')}
        disabled={!canDown}
        aria-label={`Diminuir ${label ?? 'dado'}`}
      >
        <Minus size={14} aria-hidden="true" />
      </button>
      <span className="stepper-value">
        <DieIcon die={die} size={16} />
        {die}
      </span>
      <button
        type="button"
        onClick={() => onChange(order[index + 1] ?? die)}
        disabled={!canUp}
        aria-label={`Aumentar ${label ?? 'dado'}`}
      >
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
