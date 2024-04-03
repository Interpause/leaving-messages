import { useState } from 'react'
import { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { CustomEditor } from './parts/Editor'
import { TlDisplay } from './parts/Tlremote'
import { useGlobalState } from './state'

interface EditProps {
  editHook: [boolean, (value: boolean) => void]
}

function RoomBar({ editHook }: EditProps) {
  const [editing, setEditing] = editHook
  const [snap, state] = useGlobalState()
  const roStore = snap.active.tlstore

  return (
    <div className='text-center'>
      <input
        type='text'
        className='mr-2'
        value={snap.docId ?? ''}
        placeholder={snap.active.docId ?? 'Enter docId...'}
        onChange={(e) => (state.docId = e.target.value)}
        onBlur={() => state.docId !== '' && snap.func.connect()}
      />
      <button onClick={() => setEditing(!editing)}>
        {editing ? '✓ Save' : '✎ Edit'}
      </button>
      {/* NOTE: MUST READ roStore (somehow) ELSE RERENDER WON'T TRIGGER. */}
      {roStore.error ? (
        <span>Error: {roStore.error.message}</span>
      ) : (
        <span>
          State:{' '}
          {roStore.status === 'synced-remote'
            ? roStore.connectionStatus
            : roStore.status}
        </span>
      )}
    </div>
  )
}

const subList = ['room1', 'room2', 'room3']

export default function App() {
  const [editor, setEditor] = useState<Editor>()
  const [editing, setEditing] = useState(false)

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col'>
      {editing ? '' : <RoomBar editHook={[editing, setEditing]} />}
      <div className='relative flex-grow'>
        {/* Tldraw MUST BE VISIBLE FOR EVENTS TO TRIGGER. */}
        <div className={editing ? '' : 'opacity-0 pointer-events-none -z-10'}>
          <CustomEditor
            editorHook={[editor, setEditor]}
            editHook={[editing, setEditing]}
          />
        </div>
        <div className='absolute flex flex-wrap inset-0 overflow-auto'>
          {subList.map((id, i) => (
            <div key={i}>
              <p>{id}</p>
              <TlDisplay
                docId={id}
                disabled={editing}
                className='flex items-center justify-center'
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
