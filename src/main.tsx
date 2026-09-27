import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './supabaseClient'
import './index.css'
import App from './App.tsx'
import { LoadingProvider } from './assets/components/loading_page'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </HashRouter>
  </StrictMode>,
)
