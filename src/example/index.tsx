import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Example } from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('example: #root not found')
}

createRoot(root).render(
  <StrictMode>
    <Example />
  </StrictMode>,
)
