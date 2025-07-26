import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WizardApp from './components/WizardApp.tsx'
// import FormApp from './components/FormApp.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WizardApp />
  </StrictMode>,
)
