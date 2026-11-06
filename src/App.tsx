import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { CharactersProvider } from './context/CharactersContext'
import { AppShell } from './components/layout/AppShell'
import { ArchivePage } from './pages/ArchivePage'
import { CreationPage } from './pages/CreationPage'
import { SheetPage } from './pages/SheetPage'
import { NotFoundPage } from './pages/NotFoundPage'

// BASE_URL vem do `base` do Vite: "/Ordem-2/" no GitHub Pages, "/" em dev.
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || undefined

function App() {
  return (
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <CharactersProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<ArchivePage />} />
              <Route path="nova" element={<CreationPage />} />
              <Route path="ficha/:id" element={<SheetPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CharactersProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
