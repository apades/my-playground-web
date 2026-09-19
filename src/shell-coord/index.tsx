import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ShellCoord } from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('shell-coord: #root not found')
}

createRoot(root).render(
  <StrictMode>
    <ShellCoord />
  </StrictMode>,
)
