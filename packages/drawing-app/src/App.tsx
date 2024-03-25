import { useEffect, useState } from 'react'
import { Box, Editor, TLPageId, Tldraw, TldrawImage } from 'tldraw'
import 'tldraw/tldraw.css'
import { useGlobalState } from './state'
import { useUpdate } from './utils'

// There's a guide at the bottom of this file!

export default function TldrawImageExample() {
  const [snap, state] = useGlobalState()
  const roStore = snap.active.tlstore

  const [editor, setEditor] = useState<Editor>()
  const forceUpdate = useUpdate()
  useEffect(() => (state.func.update = forceUpdate), [forceUpdate, state.func])

  const [currentPageId, setCurrentPageId] = useState<TLPageId | undefined>()
  const [showBackground, setShowBackground] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [viewportPageBounds, setViewportPageBounds] = useState(
    new Box(0, 0, 600, 400),
  )
  const [isEditing, setIsEditing] = useState(false)
  const [format, setFormat] = useState<'svg' | 'png'>('svg')

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col'>
      <div>
        <button
          className='mr-2'
          onClick={() => {
            setIsEditing(!isEditing)
            if (isEditing) {
              if (!editor) return
              setIsDarkMode(editor.user.getIsDarkMode())
              setShowBackground(editor.getInstanceState().exportBackground)
              setViewportPageBounds(editor.getViewportPageBounds())
              setCurrentPageId(editor.getCurrentPageId())
            }
          }}
        >
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
        {!isEditing && (
          <>
            <label htmlFor='format' className='mr-2'>
              Format
            </label>
            <select
              name='format'
              className='px-2 mr-2'
              value={format}
              onChange={(e) => {
                setFormat(e.currentTarget.value as 'svg' | 'png')
              }}
            >
              <option value='svg'>SVG</option>
              <option value='png'>PNG</option>
            </select>
          </>
        )}
        {/* NOTE: MUST READ roStore (somehow) ELSE RERENDER WON'T TRIGGER. */}

        {roStore.error ? (
          <span>Error: {roStore.error.message}</span>
        ) : (
          <span>State: {roStore.status}</span>
        )}
      </div>

      <div className=' flex-grow'>
        {isEditing ? (
          <Tldraw
            /* HAS TO BE THE MUTABLE VERSION (which doesn't trigger rerender...). */
            store={state.active.tlstore}
            onMount={(editor: Editor) => {
              setEditor(editor)
              editor.updateInstanceState({ isDebugMode: false })
              editor.user.updateUserPreferences({ isDarkMode })
              if (currentPageId) editor.setCurrentPage(currentPageId)
              if (viewportPageBounds)
                editor.zoomToBounds(viewportPageBounds, { inset: 0 })
            }}
          />
        ) : (
          <TldrawImage
            snapshot={roStore.store!.getSnapshot()}
            pageId={currentPageId}
            background={showBackground}
            darkMode={isDarkMode}
            bounds={viewportPageBounds}
            padding={0}
            scale={1}
            format={format}
          />
        )}
      </div>
    </div>
  )
}
