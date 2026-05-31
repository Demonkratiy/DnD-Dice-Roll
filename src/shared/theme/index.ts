import './tokens.css'

// Ось «форма» (стиль: flat/neon)
export {
  SHAPES,
  DEFAULT_SHAPE_ID,
  isShapeId,
  type ShapeId,
  type ShapeMeta,
} from './shape/shapes.ts'
export { ShapeProvider } from './shape/ShapeProvider.tsx'
export { useShape, type ShapeContextValue } from './shape/shapeContext.ts'

// Ось «цвет» (палитра)
export {
  COLORS,
  DEFAULT_COLOR_ID,
  isColorId,
  type ColorId,
  type ColorMeta,
} from './color/colors.ts'
export { ColorProvider } from './color/ColorProvider.tsx'
export { useColor, type ColorContextValue } from './color/colorContext.ts'
