import { ComponentProps, useEffect, useRef, useState } from 'react'
import { Editor, defaultShapeUtils } from 'tldraw'
import { DARK_MODE, FRAME_ID } from '../env'
import { GlobalStateProvider, useGlobalState } from '../state'

export interface TlremoteProps extends ComponentProps<'div'> {
  editor?: Editor
  disabled?: boolean
}

export function Tlremote({ editor, disabled, ...props }: TlremoteProps) {
  const svgHolderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    let animHandle: number | null = null
    const updateSvg = async () => {
      if (disabled) return
      const shapeIds = editor.getCurrentPageShapeIds()
      const svg = await editor.getSvg([...shapeIds], {
        bounds: editor.getShapePageBounds(FRAME_ID),
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
  }, [editor, disabled])

  return <div {...props} ref={svgHolderRef} />
}

export interface TlDisplay extends ComponentProps<'div'> {
  docId: string
  disabled?: boolean
}

export function TlDisplay({ docId, ...props }: TlDisplay) {
  return (
    <GlobalStateProvider docId={docId}>
      <TlDisplayInternal {...props} />
    </GlobalStateProvider>
  )
}

interface TlDisplayInternalProps extends ComponentProps<'div'> {
  disabled?: boolean
}

export function TlDisplayInternal(props: TlDisplayInternalProps) {
  const [snap] = useGlobalState()
  const [editor, setEditor] = useState<Editor>()

  useEffect(() => {
    const store = snap.active.tlstore.store
    if (!store) return

    // TODO: This is absurdly jank.
    const tempContainer = document.createElement('div')
    const tempElm = document.createElement('div')

    tempContainer.classList.add('tl-container', 'tl-theme__light')
    tempContainer.style.position = 'fixed'
    tempContainer.style.opacity = '0'
    tempContainer.style.pointerEvents = 'none'
    tempContainer.style.zIndex = '-1000'

    tempContainer.appendChild(tempElm)
    document.body.appendChild(tempContainer)

    setEditor(
      new Editor({
        store,
        shapeUtils: defaultShapeUtils,
        tools: [],
        getContainer: () => tempElm,
      }),
    )

    return () => {
      tempContainer.remove()
      tempElm.remove()
    }
  }, [snap.active.tlstore.store])

  return <Tlremote {...props} editor={editor} />
}
