import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DelayPlayer } from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('delay-player: #root not found')
}

createRoot(root).render(
  <StrictMode>
    <DelayPlayer />
  </StrictMode>,
)
