import { useEffect, useState } from 'react'
import 'tldraw/tldraw.css'
import ControlPage from './pages/Control'
import { getUrl } from './utils'

const AppModes = ['control', 'display', 'user', 'home'] as const
type AppMode = (typeof AppModes)[number]

export default function App() {
  const [mode, setMode] = useState<AppMode>()

  useEffect(() => {
    const updateMode = () => {
      const hash = getUrl().hash.slice(1) as AppMode
      if (AppModes.includes(hash)) setMode(hash)
      else setMode('home')
    }
    window.addEventListener('hashchange', updateMode)
    window.addEventListener('popstate', updateMode)
    updateMode()

    return () => {
      window.removeEventListener('hashchange', updateMode)
      window.removeEventListener('popstate', updateMode)
    }
  }, [])

  useEffect(() => {
    if (mode === undefined) return
    const url = getUrl()
    const hash = url.hash.slice(1) as AppMode
    if (hash === mode) return
    url.hash = mode
    window.history.pushState({}, '', url.toString())
  }, [mode])

  switch (mode) {
    case 'home':
      return (
        <div className='fixed inset-0 flex items-center justify-center flex-col'>
          <h3 className='text-2xl text-center'>Choose Operation Mode:</h3>
          <div>
            <button onClick={() => setMode('control')}>Control</button>
            <button onClick={() => setMode('display')}>Display</button>
            <button onClick={() => setMode('user')}>User</button>
          </div>
        </div>
      )
    case 'control':
      return <ControlPage />
    case 'display':
      return <ControlPage />
    case 'user':
      return <ControlPage />
  }
}
