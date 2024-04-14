import fscreen from 'fscreen'
import { useLayoutEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import api from '../api'
import { QUERY_PARAM_DOC } from '../env'
import { CustomEditor } from '../parts/Editor'
import { GlobalStateProvider, useGlobalState } from '../state'
import { getUrl } from '../utils'

interface SelectPageProps {
  editHook: [boolean, (isEditing: boolean) => void]
  setPrompt: (prompt?: string) => void
}

function SelectPageInternal({ editHook, setPrompt }: SelectPageProps) {
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

function UserPageInternal() {
  const [, state] = useGlobalState()
  const [editor, setEditor] = useState<Editor>()
  const [editing, setEditing] = useState(false)
  const [prompt, setPrompt] = useState<string>()

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
      />
      <SelectPageInternal
        editHook={[editing, setEditing]}
        setPrompt={setPrompt}
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
