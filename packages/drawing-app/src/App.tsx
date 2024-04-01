import { useEffect, useRef, useState } from 'react'
import { Editor, Tldraw, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { CANVAS_PROPS, DARK_MODE } from './env'
import { useGlobalState } from './state'

// TODO: Glitch with Tldraw where any update on the component (i.e., classname changing)
// will cause dark mode to reset (even if TLDraw itself thinks its on). No bug report yet.

const frameId = createShapeId('frame')
export default function App() {
  const [snap, state] = useGlobalState()
  const roStore = snap.active.tlstore

  const [editor, setEditor] = useState<Editor>()

  const [isEditing, setIsEditing] = useState(false)
  const svgHolderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    let animHandle: number | null = null
    const updateSvg = async () => {
      if (isEditing) return
      const shapeIds = editor.getCurrentPageShapeIds()
      const svg = await editor.getSvg([...shapeIds], {
        bounds: editor.getShapePageBounds(frameId),
        scale: 1,
        background: true,
        padding: 0,
        darkMode: DARK_MODE,
      })
      if (!svg) {
        const svgHolder = svgHolderRef.current
        if (!svgHolder) return
        while (svgHolder.firstChild) svgHolder.removeChild(svgHolder.firstChild)
        return
      }

      animHandle !== null && cancelAnimationFrame(animHandle)
      animHandle = requestAnimationFrame(() => {
        animHandle = null
        const svgHolder = svgHolderRef.current
        if (!svgHolder) return
        while (svgHolder.firstChild) svgHolder.removeChild(svgHolder.firstChild)
        svgHolder.appendChild(svg)
      })
    }

    updateSvg()

    return editor.store.listen(updateSvg, {
      source: 'remote',
      scope: 'document',
    })
  }, [editor, isEditing])

  // Create "canvas" and zoom to it.
  useEffect(() => {
    if (!editor) return
    const shape = { id: frameId, type: 'frame', props: CANVAS_PROPS }
    if (!editor.getShape(frameId)) editor.createShape(shape)
    else editor.updateShape(shape)
  }, [editor])

  // Zoom to canvas.
  useEffect(() => {
    if (!editor) return
    if (!isEditing) return
    editor.zoomToBounds(editor.getShapePageBounds(frameId)!, { duration: 200 })
  }, [editor, isEditing])

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col'>
      <div className='text-center'>
        <button className='mr-2' onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? '✓ Save' : '✎ Edit'}
        </button>
        <input
          type='text'
          className='mr-2'
          value={snap.docId ?? ''}
          placeholder={snap.active.docId ?? 'Enter docId...'}
          onChange={(e) => (state.docId = e.target.value)}
          onBlur={() => state.docId !== '' && snap.func.connect()}
        />
        <br />
        {/* NOTE: MUST READ roStore (somehow) ELSE RERENDER WON'T TRIGGER. */}
        {roStore.error ? (
          <span>Error: {roStore.error.message}</span>
        ) : (
          <span>State: {roStore.status}</span>
        )}
      </div>

      <div className='relative flex-grow'>
        {/* Tldraw MUST BE VISIBLE FOR EVENTS TO TRIGGER. */}
        <div className={isEditing ? '' : 'opacity-0 pointer-events-none -z-10'}>
          <Tldraw
            /* HAS TO BE THE MUTABLE VERSION (which doesn't trigger rerender...). */
            store={state.active.tlstore}
            /* NOTE: convenient to use this editor rather than create one for preview. */
            className='absolute inset-0'
            onMount={(editor: Editor) => {
              editor.updateInstanceState({ isDebugMode: true })
              editor.user.updateUserPreferences({ isDarkMode: DARK_MODE })
              setEditor(editor)
            }}
            components={{
              Background: () => (
                <div className='absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-800' />
              ),
            }}
          />
        </div>
        <div
          ref={svgHolderRef}
          className='absolute inset-0 flex items-center justify-center'
        ></div>
      </div>
    </div>
  )
}
