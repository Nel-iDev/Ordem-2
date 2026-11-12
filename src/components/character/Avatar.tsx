import { initials } from '../../lib/utils'

interface AvatarProps {
  name: string
  portrait?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, portrait, size = 'md' }: AvatarProps) {
  const sizeClass = size === 'lg' ? ' avatar-lg' : size === 'sm' ? ' avatar-sm' : ''
  return (
    <div className={`avatar${sizeClass}`}>
      {portrait ? <img src={portrait} alt={`Retrato de ${name || 'personagem'}`} /> : initials(name)}
    </div>
  )
}
