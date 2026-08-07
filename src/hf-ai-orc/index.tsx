import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HfAiOrc } from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('hf-ai-orc: #root not found')
}

createRoot(root).render(
  <StrictMode>
    <HfAiOrc />
  </StrictMode>,
)
