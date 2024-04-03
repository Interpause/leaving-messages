import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { CustomEditor } from '../parts/Editor'
import { GlobalStateProvider, useGlobalState } from '../state'

function UserPageInternal() {
  const [snap, state] = useGlobalState()
  const [editor, setEditor] = useState<Editor>()
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (editing) return
    ;(async () => {
      const data = await fetch('/api/v1/random_doc')
      console.log('Received', data)
      const { docId } = await data.json()

      if (!docId) {
        toast.error('Failed to create document.')
        return
      }

      state.docId = docId
      await snap.func.connect()

      setEditing(true)
    })()
  }, [editing, snap, state])

  return (
    <div className='fixed inset-0 overflow-hidden'>
      <CustomEditor
        editorHook={[editor, setEditor]}
        editHook={[editing, setEditing]}
      />
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black opacity-40 ${editing ? '' : 'hidden'}`}
      >
        <p className='text-4xl text-black'>Loading! Please wait...</p>
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
