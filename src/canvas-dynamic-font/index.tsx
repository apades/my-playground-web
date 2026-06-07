import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CanvasDynamicFont } from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('canvas-dynamic-font: #root not found')
}

createRoot(root).render(<CanvasDynamicFont />)
