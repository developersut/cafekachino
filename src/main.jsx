import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import App from './App.jsx'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: 'rgba(20, 20, 35, 0.95)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          color: '#fff',
          backdropFilter: 'blur(12px)',
          fontSize: '0.9rem',
        },
      }}
      richColors
    />
  </StrictMode>,
)
