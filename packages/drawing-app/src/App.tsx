import { useLayoutEffect, useState } from 'react'
import 'tldraw/tldraw.css'
import ControlPage from './pages/Control'
import DisplayPage from './pages/Display'
import UserPage from './pages/User'
import { getUrl, toggleEruda } from './utils'

const AppModes = ['control', 'display', 'user', 'home'] as const
type AppMode = (typeof AppModes)[number]

export default function App() {
  const [mode, setMode] = useState<AppMode>()

  useLayoutEffect(() => {
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

  useLayoutEffect(() => {
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
        <div className='fixed inset-0 flex items-center justify-center flex-col gap-1'>
          <h3 className='text-3xl text-center'>Choose Operation Mode</h3>
          <div className='join w-5/6 md:w-80'>
            <button
              className='btn join-item flex-1'
              onClick={() => setMode('control')}
            >
              Control
            </button>
            <button
              className='btn join-item flex-1'
              onClick={() => setMode('display')}
            >
              Display
            </button>
            <button
              className='btn join-item flex-1'
              onClick={() => setMode('user')}
            >
              User
            </button>
          </div>
          <button className='btn' onClick={toggleEruda}>
            Toggle Eruda
          </button>
        </div>
      )
    case 'control':
      return <ControlPage />
    case 'display':
      return <DisplayPage />
    case 'user':
      return <UserPage />
  }
}
