// Токены тем разбиты на три слоя; порядок важен — каскад «стиль → палитра»:
//  base       — ось «стиль» (flat/neon) + базовые семантические токены;
//  palettes   — ось «цвет» (data-theme-colors), переопределяет акценты;
//  animations — keyframes (свечение сцены, дыхание кубика, дрейф).
import './css/base.css'
import './css/palettes.css'
import './css/animations.css'

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
