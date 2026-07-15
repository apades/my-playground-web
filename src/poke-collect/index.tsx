import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PokeCollect } from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('poke-collect: #root not found')
}

createRoot(root).render(
  <StrictMode>
    <PokeCollect />
  </StrictMode>,
)
