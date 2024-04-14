import fscreen from 'fscreen'
import { useLayoutEffect, useState } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import toast from 'react-hot-toast'
import { Editor, Vec, track, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import api from '../api'
import { FRAME_ID, QUERY_PARAM_DOC } from '../env'
import { CustomEditor } from '../parts/Editor'
import { GlobalStateProvider, useGlobalState } from '../state'
import { getUrl } from '../utils'

const DURATION = 30

interface SelectPageProps {
  editHook: [boolean, (isEditing: boolean) => void]
  setPrompt: (prompt?: string) => void
  setMode: (mode: 'self' | 'room') => void
}

function SelectPageInternal({ editHook, setPrompt, setMode }: SelectPageProps) {
  const [snap, state] = useGlobalState()
  const [editing, setEditing] = editHook

  const handleSelfDoodle = () => {
    const promise = (async () => {
      const data = await api.randomDoc()
      console.log('Received', data)
      const { docId } = data

      if (!docId) throw new Error('Did not receive docId.')

      state.docId = docId
      await snap.func.connect()

      setEditing(true)
      setPrompt('Draw what you want for lunch!')
      setMode('self')
    })()

    toast.promise(promise, {
      loading: 'Creating document...',
      success: 'Document created!',
      error: (err) => `Failed to create document: ${err.toString()}`,
    })
  }

  const handleRoomDoodle = () => {
    const promise = (async () => {
      const data = await api.sharedDoc()
      console.log('Received', data)
      const { docId } = data

      if (!docId) throw new Error('Did not receive docId.')

      state.docId = docId
      await snap.func.connect()

      setEditing(true)
      setPrompt('Cats @ Changi City Point')
      setMode('room')
      setTimeout(
        () => {
          if (state.active.docId !== docId) return
          setEditing(false)
          toast.dismiss()
          toast.success('Done!')
          setTimeout(() => (state.docId = undefined))
        },
        (DURATION + 0.5) * 1000,
      )
    })()

    toast.promise(promise, {
      loading: 'Loading room...',
      success: 'Loaded!',
      error: (err) => `Failed to load: ${err.toString()}`,
    })
  }

  return (
    <div
      className={`fixed inset-0 bg-yellow-400 text-black ${editing ? 'hidden' : ''}`}
    >
      <div className='absolute inset-0 bg-orange-400 mx-auto max-w-prose flex flex-col items-center justify-center gap-4'>
        <h1
          className='text-5xl text-center'
          onClick={() => fscreen.requestFullscreen(document.body)}
        >
          🌟lighten up!🎨
        </h1>
        <h1
          className='text-xl text-center'
          onClick={() => fscreen.requestFullscreen(document.body)}
        >
          select doodling mode:
        </h1>
        <button
          className='btn btn-error w-3/5 md:w-1/5'
          onClick={handleSelfDoodle}
        >
          🍃your own pace
        </button>
        <button
          className='btn btn-warning w-3/5 md:w-1/5'
          onClick={handleRoomDoodle}
        >
          🙌with others
        </button>
      </div>
    </div>
  )
}

const renderTime = ({ remainingTime }: { remainingTime: number }) => {
  if (remainingTime === 0)
    return (
      <p className='text-base'>
        Out of
        <br />
        Time!
      </p>
    )

  return <p className='text-4xl'>{remainingTime}</p>
}

const MyComponentInFront = track(() => {
  const editor = useEditor()
  const frameBounds = editor.getShapePageBounds(FRAME_ID)
  if (!frameBounds) return

  const spaceCoord = frameBounds.point
  spaceCoord.addXY(frameBounds.w, -4)

  const maxViewport = editor.getViewportScreenBounds()

  const coords = Vec.Sub(editor.pageToScreen(spaceCoord), maxViewport)

  return (
    <div
      className='absolute -translate-x-full -translate-y-full rounded-[8px] p-2'
      style={{
        top: Math.max(0, coords.y),
        left: Math.max(0, coords.x),
        background: '#efefef',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      <CountdownCircleTimer
        isPlaying
        duration={DURATION}
        colors={['#00ff00', '#ffff00', '#ff0000']}
        colorsTime={[DURATION, Math.floor((DURATION * 2) / 3), 0]}
        size={100}
      >
        {renderTime}
      </CountdownCircleTimer>
    </div>
  )
})

function UserPageInternal() {
  const [, state] = useGlobalState()
  const [editor, setEditor] = useState<Editor>()
  const [editing, setEditing] = useState(false)
  const [prompt, setPrompt] = useState<string>()
  const [mode, setMode] = useState<'self' | 'room'>('self')

  useLayoutEffect(() => {
    if (editing) return
    // Allow user to refresh page. Have to use long form as state hasnt update yet.
    if (
      getUrl().searchParams.get(QUERY_PARAM_DOC) &&
      state.docId === undefined
    ) {
      setEditing(true)
      return
    }
  }, [editing, state])

  return (
    <div className='fixed inset-0 overflow-hidden'>
      <CustomEditor
        editorHook={[editor, setEditor]}
        editHook={[editing, setEditing]}
        canvasName={prompt}
        components={{
          InFrontOfTheCanvas:
            editing && mode === 'room' ? MyComponentInFront : null,
        }}
      />
      <SelectPageInternal
        editHook={[editing, setEditing]}
        setPrompt={setPrompt}
        setMode={setMode}
      />
    </div>
  )
}

export default function UserPage() {
  return (
    <GlobalStateProvider isMain>
      <UserPageInternal />
    </GlobalStateProvider>
  )
}
