import { ComponentProps, useLayoutEffect, useRef, useState } from 'react'
import { Editor, defaultShapeUtils } from 'tldraw'
import { DARK_MODE, FRAME_ID } from '../env'
import { GlobalStateProvider, useGlobalState } from '../state'

export interface TlremoteProps extends ComponentProps<'div'> {
  editor?: Editor
  disabled?: boolean
}

export function Tlremote({ editor, disabled, ...props }: TlremoteProps) {
  const svgHolderRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!editor) return

    let animHandle: number | null = null
    let ready = true
    const updateSvg = async () => {
      if (disabled || !ready) return
      ready = false
      const shapeIds = editor.getCurrentPageShapeIds()
      const bounds = editor.getShapePageBounds(FRAME_ID)
      if (!bounds) return
      const svg = await editor.getSvg([...shapeIds], {
        bounds: bounds.clone(), // NOTE: getSvg mutates bounds, cause zoom-in if neg padding used
        scale: 1,
        background: false,
        padding: -2,
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
        svg.style.width = '100%'
        svg.style.height = '100%'
        svgHolder.appendChild(svg)
      })
      ready = true
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
  onLocalChange?: () => void
  onRemoteChange?: () => void
}

export function TlDisplay({
  docId,
  onLocalChange,
  onRemoteChange,
  ...props
}: TlDisplay) {
  return (
    <GlobalStateProvider
      docId={docId}
      onLocalChange={onLocalChange}
      onRemoteChange={onRemoteChange}
    >
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

  useLayoutEffect(() => {
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
