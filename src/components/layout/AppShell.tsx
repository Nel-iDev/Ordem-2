import { NavLink, Outlet } from 'react-router-dom'
import { Plus, Skull } from 'lucide-react'

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container app-header-inner">
          <NavLink to="/" className="brand" aria-label="Arquivo 2 — início">
            <span className="brand-mark">
              <Skull size={18} aria-hidden="true" />
            </span>
            <span className="brand-text">
              <span className="brand-title">Arquivo 2</span>
              <span className="brand-sub">Fichas de campo</span>
            </span>
          </NavLink>

          <nav className="app-nav" aria-label="Navegação principal">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Arquivo
            </NavLink>
            <NavLink
              to="/nova"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Plus size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Nova ficha
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="container">
          <span>Arquivo 2 · fichas salvas localmente no seu navegador</span>
          <span className="mono">d4 · d6 · d8 · d10 · d12</span>
        </div>
      </footer>
    </div>
  )
}
