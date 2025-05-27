import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/main.css'
import "@radix-ui/themes/styles.css";
import { Theme } from '@radix-ui/themes';
import { Root } from '@/views/Root'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme>
      <Root />
    </Theme>
  </StrictMode>,
)
