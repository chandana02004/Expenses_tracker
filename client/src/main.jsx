import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply persisted theme before first paint (avoids flash)
try {
  const stored = JSON.parse(localStorage.getItem('expense-tracker-store') || '{}')
  const theme = stored?.state?.theme ?? 'dark'
  if (theme === 'dark') document.documentElement.classList.add('dark')
} catch {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
