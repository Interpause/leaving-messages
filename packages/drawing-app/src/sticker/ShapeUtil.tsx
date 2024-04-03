import { useState } from 'react'
import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  TLOnResizeHandler,
  getDefaultColorTheme,
  resizeBox,
} from 'tldraw'
import { stickerShapeMigrations } from './migration'
import { StickerShape, stickerShapeProps } from './types'

// There's a guide at the bottom of this file!

export class StickerShapeUtil extends ShapeUtil<StickerShape> {
  static override type = 'sticker' as const
  static override props = stickerShapeProps
  static override migrations = stickerShapeMigrations

  override isAspectRatioLocked = () => true
  override canResize = () => true
  override canBind = () => true

  // [4]
  getDefaultProps(): StickerShape['props'] {
    return {
      w: 32,
      h: 32,
      color: 'black',
    }
  }

  // [5]
  getGeometry(shape: StickerShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  // [6]
  component(shape: StickerShape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds
    const theme = getDefaultColorTheme({
      isDarkMode: this.editor.user.getIsDarkMode(),
    })

    //[a]
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [count, setCount] = useState(0)

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          border: '1px solid black',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'all',
          backgroundColor: theme[shape.props.color].semi,
          color: theme[shape.props.color].solid,
        }}
      >
        <h2>Clicks: {count}</h2>
        <button
          // [b]
          onClick={() => setCount((count) => count + 1)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {bounds.w.toFixed()}x{bounds.h.toFixed()}
        </button>
      </HTMLContainer>
    )
  }

  // [7]
  indicator(shape: StickerShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  // [8]
  override onResize: TLOnResizeHandler<StickerShape> = (shape, info) => {
    return resizeBox(shape, info)
  }
}
/* 
A utility class for the card shape. This is where you define the shape's behavior, 
how it renders (its component and indicator), and how it handles different events.

[1]
A validation schema for the shape's props (optional)
Check out card-shape-props.ts for more info.

[2]
Migrations for upgrading shapes (optional)
Check out card-shape-migrations.ts for more info.

[3]
Letting the editor know if the shape's aspect ratio is locked, and whether it 
can be resized or bound to other shapes. 

[4]
The default props the shape will be rendered with when click-creating one.

[5]
We use this to calculate the shape's geometry for hit-testing, bindings and
doing other geometric calculations. 

[6]
Render method — the React component that will be rendered for the shape. It takes the 
shape as an argument. HTMLContainer is just a div that's being used to wrap our text 
and button. We can get the shape's bounds using our own getGeometry method.
	
- [a] Check it out! We can do normal React stuff here like using setState.
   Annoying: eslint sometimes thinks this is a class component, but it's not.

- [b] You need to stop the pointer down event on buttons, otherwise the editor will
	   think you're trying to select drag the shape.

[7]
Indicator — used when hovering over a shape or when it's selected; must return only SVG elements here

[8]
Resize handler — called when the shape is resized. Sometimes you'll want to do some 
custom logic here, but for our purposes, this is fine.
*/
