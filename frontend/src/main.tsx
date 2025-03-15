import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AgentProvider } from './components/agent-provider.component.tsx';
import { ThemeProvider } from './components/theme-provider.component.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AgentProvider>
        <App />
      </AgentProvider>
    </ThemeProvider>
  </StrictMode>,
)
