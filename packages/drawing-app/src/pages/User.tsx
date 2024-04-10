import { useLayoutEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import api from '../api'
import { QUERY_PARAM_DOC } from '../env'
import { CustomEditor } from '../parts/Editor'
import { GlobalStateProvider, useGlobalState } from '../state'
import { getUrl } from '../utils'

function UserPageInternal() {
  const [snap, state] = useGlobalState()
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
    } else
      (async () => {
        const data = await api.randomDoc()
        console.log('Received', data)
        const { docId } = data

        if (!docId) {
          toast.error('Failed to create document.')
          return
        }

        state.docId = docId
        await snap.func.connect()

        setEditing(true)
      })()
  }, [editing, snap.func, state])

  return (
    <div className='fixed inset-0 overflow-hidden'>
      <CustomEditor
        editorHook={[editor, setEditor]}
        editHook={[editing, setEditing]}
      />
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40 ${editing ? 'hidden' : ''}`}
      >
        <p className='text-4xl text-white'>Loading! Please wait...</p>
      </div>
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
