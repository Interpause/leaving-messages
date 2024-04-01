import { ComponentProps, useEffect, useRef } from 'react'
import { Editor } from 'tldraw'
import { DARK_MODE, FRAME_ID } from './env'

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
