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
}

function SelectPageInternal({ editHook }: SelectPageProps) {
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
    })()

    toast.promise(promise, {
      loading: 'Loading room...',
      success: 'Loaded!',
      error: (err) => `Failed to load: ${err.toString()}`,
    })
  }

  return (
    <div className={`fixed inset-0 bg-gray-950 ${editing ? 'hidden' : ''}`}>
      <div className='absolute inset-0 bg-gray-900 mx-auto max-w-prose flex flex-col items-center justify-center gap-4'>
        <h1
          className='text-4xl text-center'
          onClick={() => fscreen.requestFullscreen(document.body)}
        >
          Welcome!
        </h1>
        <button
          className='btn btn-primary w-3/5 md:w-1/5'
          onClick={handleSelfDoodle}
        >
          Self-doodle
        </button>
        <button
          className='btn btn-secondary w-3/5 md:w-1/5'
          onClick={handleRoomDoodle}
        >
          C-Sketch
        </button>
      </div>
    </div>
  )
}

function UserPageInternal() {
  const [, state] = useGlobalState()
  const [editor, setEditor] = useState<Editor>()
  const [editing, setEditing] = useState(false)

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
      />
      <SelectPageInternal editHook={[editing, setEditing]} />
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
