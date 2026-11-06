import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="container not-found">
      <span className="eyebrow">Arquivo corrompido</span>
      <h1>404</h1>
      <p className="muted">Esta página não existe no dossiê.</p>
      <div>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={15} aria-hidden="true" /> Voltar ao arquivo
        </Link>
      </div>
    </div>
  )
}
