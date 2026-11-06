import { initials } from '../../lib/utils'

interface AvatarProps {
  name: string
  portrait?: string
  size?: 'md' | 'lg'
}

export function Avatar({ name, portrait, size = 'md' }: AvatarProps) {
  return (
    <div className={`avatar${size === 'lg' ? ' avatar-lg' : ''}`}>
      {portrait ? <img src={portrait} alt={`Retrato de ${name || 'personagem'}`} /> : initials(name)}
    </div>
  )
}
