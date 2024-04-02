import { useEffect, useState } from 'react'
import {
  DefaultStylePanel,
  Editor,
  HTMLContainer,
  Tldraw,
  TldrawUiButton,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { Tlremote } from './Tlremote'
import { CANVAS_PROPS, DARK_MODE, FRAME_ID } from './env'
import { useGlobalState } from './state'

// TODO: Glitch with Tldraw where any update on the component (i.e., classname changing)
// will cause dark mode to reset (even if TLDraw itself thinks its on). No bug report yet.

interface EditProps {
  editHook: [boolean, (value: boolean) => void]
}

function CustomSharePanel() {
  const [snap] = useGlobalState()
  const roStore = snap.active.tlstore
  return (
    <DefaultStylePanel>
      <div className='p-2'>
        <p>{'Room: ' + snap.docId ?? ''}</p>
        <p>
          {'Status: ' +
            (roStore.error
              ? roStore.error.message
              : roStore.status === 'synced-remote'
                ? roStore.connectionStatus
                : roStore.status)}
        </p>
      </div>
    </DefaultStylePanel>
  )
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
  const [, state] = useGlobalState()

  const [editor, setEditor] = useState<Editor>()
  const [editing, setEditing] = useState(false)

  // Config editor.
  useEffect(() => {
    if (!editor) return
    editor.updateInstanceState({ isDebugMode: false })
    editor.user.updateUserPreferences({ isDarkMode: DARK_MODE })
  }, [editor])

  // Create "canvas" and zoom to it.
  useEffect(() => {
    // NOTE: Purposefully depend on isEditing to implicitly recreate frame if user deletes it.
    if (!editor || !editing) return
    const shape = { id: FRAME_ID, type: 'frame', props: CANVAS_PROPS }
    if (!editor.getShape(FRAME_ID)) editor.createShape(shape)
    else editor.updateShape(shape)
  }, [editor, editing])

  // Zoom to canvas.
  useEffect(() => {
    if (!editor || !editing) return
    const bounds = editor.getShapePageBounds(FRAME_ID)
    if (!bounds) return
    editor.zoomToBounds(bounds, { duration: 200 })
  }, [editor, editing])

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col'>
      {editing ? '' : <RoomBar editHook={[editing, setEditing]} />}
      <div className='relative flex-grow'>
        {/* Tldraw MUST BE VISIBLE FOR EVENTS TO TRIGGER. */}
        <div className={editing ? '' : 'opacity-0 pointer-events-none -z-10'}>
          <Tldraw
            // TODO: I give up on TldrawEditor, go with hide UI overlay custom UI approach instead.
            // ^ instead of complete hide, do per component override instead.
            /* HAS TO BE THE MUTABLE VERSION (which doesn't trigger rerender...). */
            store={state.active.tlstore}
            className='absolute inset-0'
            /* NOTE: convenient to use this editor rather than create one for preview. */
            onMount={setEditor}
            components={{
              Background: () => (
                <div className='absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-800' />
              ),
              TopPanel: () => (
                <HTMLContainer className='zone-center'>
                  <TldrawUiButton
                    type='menu'
                    className='text-center'
                    onClick={() => setEditing(false)}
                  >
                    ✓ Done
                  </TldrawUiButton>
                </HTMLContainer>
              ),
              //Toolbar: () => <div>Toolbar</div>,
              PageMenu: null,
              //StylePanel: null,
              SharePanel: () => <CustomSharePanel />,
            }}
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
