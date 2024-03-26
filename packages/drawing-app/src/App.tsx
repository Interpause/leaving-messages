import { useEffect, useRef, useState } from 'react'
import { Box, Editor, TLPageId, Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useGlobalState } from './state'

// There's a guide at the bottom of this file!

export default function TldrawImageExample() {
  const [snap, state] = useGlobalState()
  const roStore = snap.active.tlstore

  const [editor, setEditor] = useState<Editor>()

  const [currentPageId, setCurrentPageId] = useState<TLPageId | undefined>()
  const [showBackground, setShowBackground] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [viewportPageBounds, setViewportPageBounds] = useState(
    new Box(0, 0, 600, 400),
  )
  const [isEditing, setIsEditing] = useState(false)
  const svgHolderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    let animHandle: number | null = null
    const updateSvg = async () => {
      if (isEditing) return
      const shapeIds = editor.getCurrentPageShapeIds()
      const svg = await editor.getSvg([...shapeIds], {
        bounds: viewportPageBounds,
        scale: 1,
        background: showBackground,
        padding: 0,
        darkMode: isDarkMode,
      })
      if (!svg) return

      animHandle !== null && cancelAnimationFrame(animHandle)
      animHandle = requestAnimationFrame(() => {
        animHandle = null
        const svgHolder = svgHolderRef.current
        if (!svgHolder) return
        while (svgHolder.firstChild) svgHolder.removeChild(svgHolder.firstChild)
        svg.style.position = 'absolute'
        svg.style.height = '100%'
        svg.style.width = '100%'
        svgHolder.appendChild(svg)
      })
    }

    updateSvg()

    return editor.store.listen(updateSvg, {
      source: 'remote',
      scope: 'document',
    })
  }, [
    currentPageId,
    editor,
    isDarkMode,
    isEditing,
    showBackground,
    viewportPageBounds,
  ])

  useEffect(() => {
    if (!editor) return
    if (isEditing) return
    setIsDarkMode(editor.user.getIsDarkMode())
    setShowBackground(editor.getInstanceState().exportBackground)
    setViewportPageBounds(editor.getViewportPageBounds())
    setCurrentPageId(editor.getCurrentPageId())
  }, [editor, isEditing])

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col'>
      <div>
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
        <Tldraw
          /* HAS TO BE THE MUTABLE VERSION (which doesn't trigger rerender...). */
          store={state.active.tlstore}
          /* NOTE: convenient to use this editor rather than create one for preview. */
          className={`absolute inset-0 ${
            isEditing ? '' : 'opacity-0 pointer-events-none -z-10'
          }`}
          onMount={(editor: Editor) => {
            editor.updateInstanceState({ isDebugMode: false })
            editor.user.updateUserPreferences({ isDarkMode })
            if (currentPageId) editor.setCurrentPage(currentPageId)
            if (viewportPageBounds)
              editor.zoomToBounds(viewportPageBounds, { inset: 0 })
            setEditor(editor)
          }}
        />
        <div ref={svgHolderRef} className='absolute inset-0'></div>
      </div>
    </div>
  )
}
