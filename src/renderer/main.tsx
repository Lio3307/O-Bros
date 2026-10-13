import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@xterm/xterm/css/xterm.css'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/tokens.css'
import './styles/base.css'
import './styles/shell.css'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('The #root element is missing from index.html')
}

createRoot(rootElement).render(<App />)
