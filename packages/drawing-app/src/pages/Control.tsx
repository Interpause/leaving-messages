import { useState } from 'react'
import { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { CustomEditor } from '../parts/Editor'
import { Tlremote } from '../parts/Tlremote'
import { GlobalStateProvider, useGlobalState } from '../state'

interface EditProps {
  editHook: [boolean, (value: boolean) => void]
}

function CtrlBar({ editHook }: EditProps) {
  const [editing, setEditing] = editHook
  const [snap, state] = useGlobalState()
  const roStore = snap.active.tlstore

  // TODO: In addition to input, provide list of all created docs?
  // Preview all docs? Click preview to edit?
  return (
    <div className='text-center'>
      <h3 className='text-2xl'>Control Panel</h3>
      <input
        type='text'
        className='mr-2'
        value={snap.docId ?? ''}
        placeholder={snap.active.docId ?? 'Enter docId...'}
        onChange={(e) => (state.docId = e.target.value)}
        onBlur={() => state.docId !== '' && snap.func.connect()}
        onKeyDown={(e) =>
          e.key === 'Enter' && (e.target as HTMLInputElement).blur()
        }
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

function ControlPageInternal() {
  const [editor, setEditor] = useState<Editor>()
  const [editing, setEditing] = useState(false)

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col'>
      {editing ? '' : <CtrlBar editHook={[editing, setEditing]} />}
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
          className='flex items-center justify-center'
        />
      </div>
    </div>
  )
}

export default function ControlPage() {
  return (
    <GlobalStateProvider isMain>
      <ControlPageInternal />
    </GlobalStateProvider>
  )
}
