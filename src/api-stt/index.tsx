import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApiStt } from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('api-stt: #root not found')
}

createRoot(root).render(
  <StrictMode>
    <ApiStt />
  </StrictMode>,
)
