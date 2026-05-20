import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './tailwind-animations.css'
import './styles/cyberpunk.css'
import { TRPCProvider } from './providers/TRPCProvider.tsx'
import { I18nProvider } from './providers/I18nProvider.tsx'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <TRPCProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TRPCProvider>
    </I18nProvider>
  </React.StrictMode>,
)
