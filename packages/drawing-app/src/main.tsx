import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { GlobalStateProvider } from './state'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalStateProvider isMain>
      <App />
    </GlobalStateProvider>
    <Toaster position='bottom-right' />
  </React.StrictMode>,
)
