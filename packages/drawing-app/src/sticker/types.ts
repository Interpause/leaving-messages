import {
  DefaultColorStyle,
  ShapeProps,
  T,
  TLBaseShape,
  TLDefaultColorStyle,
} from 'tldraw'

// Validation for our custom card shape's props, using one of tldraw's default styles
export const stickerShapeProps: ShapeProps<StickerShape> = {
  w: T.number,
  h: T.number,
  color: DefaultColorStyle,
}
// A type for our custom card shape
export type StickerShape = TLBaseShape<
  'sticker',
  {
    w: number
    h: number
    color: TLDefaultColorStyle
  }
>
