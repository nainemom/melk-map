import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Root } from '@/views/Root'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
