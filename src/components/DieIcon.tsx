import type { AttrKey, Die } from '../types'

const ATTR_CLASS: Record<AttrKey, string> = {
  fisico: 'die-fisico',
  mente: 'die-mente',
  emocao: 'die-emocao',
}

interface DieIconProps {
  die: Die
  attr?: AttrKey
  size?: number
  className?: string
}

const SHAPES: Record<Die, React.ReactNode> = {
  d4: <polygon points="12,2 22,21 2,21" />,
  d6: <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />,
  d8: <polygon points="12,1 23,12 12,23 1,12" />,
  d10: <polygon points="12,1 22,9 12,23 2,9" />,
  d12: <polygon points="12,1 20.5,6 20.5,18 12,23 3.5,18 3.5,6" />,
  d20: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,4 19,8.5 19,15.5 12,20 5,15.5 5,8.5" />
    </>
  ),
}

export function DieIcon({ die, attr, size = 28, className = '' }: DieIconProps) {
  return (
    <span
      className={`die-icon ${attr ? ATTR_CLASS[attr] : ''} ${className}`}
      style={{ width: size, height: size }}
      title={die}
      aria-label={`Dado ${die}`}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        {SHAPES[die]}
      </svg>
    </span>
  )
}
