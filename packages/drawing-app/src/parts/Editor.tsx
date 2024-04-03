import fscreen from 'fscreen'
import { useEffect, useMemo } from 'react'
import {
  DefaultFillStyle,
  DefaultStylePanel,
  DefaultStylePanelContent,
  DefaultToolbar,
  DrawToolbarItem,
  Editor,
  EraserToolbarItem,
  HandToolbarItem,
  ReadonlySharedStyleMap,
  Tldraw,
  TldrawUiButton,
  useRelevantStyles,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { CANVAS_PROPS, DARK_MODE, FRAME_ID } from '../env'
import { useGlobalState } from '../state'

const colorReg = /^#([0-9a-f]{3}){1,2}$/i

function CustomSharePanel() {
  const [snap] = useGlobalState()
  const roStore = snap.active.tlstore
  const docId = snap.active.docId

  let background = `#${docId}`
  if (!colorReg.test(background)) background = 'transparent'

  return (
    <DefaultStylePanel>
      <div
        className='p-2'
        onClick={() => fscreen.requestFullscreen(document.body)}
      >
        <p>
          <em className='font-semibold'>ID</em>
          <span className='float-right' style={{ background }}>
            <span className='mix-blend-difference text-white [text-shadow:2px_2px_#666]'>
              {docId ?? ''}
            </span>
          </span>
        </p>
        <p>
          <em className='font-semibold'>Status</em>
          <span className='float-right'>
            {roStore.error
              ? roStore.error.message
              : roStore.status === 'synced-remote'
                ? roStore.connectionStatus
                : roStore.status}
          </span>
        </p>
      </div>
    </DefaultStylePanel>
  )
}

function CustomStylePanel() {
  const styles = useRelevantStyles()
  const modified = useMemo(() => {
    if (!styles) return null
    const modified = new ReadonlySharedStyleMap(
      [...styles.entries()].filter(([key]) => key !== DefaultFillStyle),
    )
    return modified
  }, [styles])

  return (
    <DefaultStylePanel>
      <DefaultStylePanelContent styles={modified} />
    </DefaultStylePanel>
  )
}

function CustomToolbar() {
  return (
    <DefaultToolbar>
      <HandToolbarItem />
      <DrawToolbarItem />
      <EraserToolbarItem />
    </DefaultToolbar>
  )
}

export interface CustomEditorProps {
  editorHook: [Editor | undefined, (editor: Editor | undefined) => void]
  editHook: [boolean, (isEditing: boolean) => void]
  fullMode?: boolean
}

// TODO: Glitch with Tldraw where any update on the component (i.e., classname changing)
// will cause dark mode to reset (even if TLDraw itself thinks its on). No bug report yet.
export function CustomEditor({
  editorHook,
  editHook,
  fullMode,
}: CustomEditorProps) {
  const [, state] = useGlobalState()
  const [editor, setEditor] = editorHook
  const [editing, setEditing] = editHook

  // Set editor config.
  useEffect(() => {
    if (!editor || !editing) return
    editor.updateInstanceState({ isDebugMode: false })
    editor.user.updateUserPreferences({ isDarkMode: DARK_MODE })
  }, [editor, editing])

  // Create "canvas" and zoom to it.
  useEffect(() => {
    // NOTE: Purposefully depend on isEditing to implicitly recreate frame if user deletes it.
    if (!editor || !editing) return
    const shape: Parameters<typeof editor.updateShape>[0] = {
      id: FRAME_ID,
      type: 'frame',
      props: CANVAS_PROPS,
      isLocked: true,
    }
    if (!editor.getShape(FRAME_ID)) editor.createShape(shape)
    else editor.updateShape(shape)
  }, [editor, editing])

  // Zoom to canvas.
  useEffect(() => {
    if (!editor || !editing) return
    const bounds = editor.getShapePageBounds(FRAME_ID)
    if (!bounds) return
    editor.zoomToBounds(bounds, { duration: 200, inset: 50 })
  }, [editor, editing])

  return (
    <Tldraw
      // TODO: I give up on TldrawEditor, go with hide UI overlay custom UI approach instead.
      // ^ instead of complete hide, do per component override instead.
      /* HAS TO BE THE MUTABLE VERSION (which doesn't trigger rerender...). */
      store={state.active.tlstore}
      className='absolute inset-0'
      /* NOTE: convenient to use this editor rather than create one for preview. */
      onMount={setEditor}
      initialState='draw'
      components={{
        Background: () => (
          <div className='absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-800' />
        ),
        TopPanel: () => (
          <div className='zone-center'>
            <TldrawUiButton
              type='menu'
              className='text-center'
              onClick={() => setEditing(false)}
            >
              ✓ Done
            </TldrawUiButton>
          </div>
        ),
        ...(!fullMode && {
          Toolbar: () => <CustomToolbar />,
          PageMenu: null,
          ActionsMenu: null,
          MainMenu: null,
          HelpMenu: null,
          StylePanel: () => <CustomStylePanel />,
          SharePanel: () => <CustomSharePanel />,
        }),
      }}
    />
  )
}
