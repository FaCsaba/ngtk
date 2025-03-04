import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AgentWasm } from './agent.ts';

const agent = await AgentWasm.new();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App agent={agent} />
  </StrictMode>,
)
