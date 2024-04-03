import { useState } from 'react'
import { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { CustomEditor } from './Editor'
import { Tlremote } from './Tlremote'
import { useGlobalState } from './state'

// TODO: Glitch with Tldraw where any update on the component (i.e., classname changing)
// will cause dark mode to reset (even if TLDraw itself thinks its on). No bug report yet.

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
        <Tlremote
          editor={editor}
          disabled={editing}
          className='absolute inset-0 flex items-center justify-center'
        />
      </div>
    </div>
  )
}
