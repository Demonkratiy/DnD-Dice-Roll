/**
 * Геометрия силуэтов кубиков.
 *
 * Каждый номинал рисуется как плоский SVG-полигон в системе координат 100×100.
 * «Перебор форм» во время броска реализован как смена ВАРИАЦИЙ одного и того же
 * номинала: вариации — это поворот базового силуэта на небольшой угол, что даёт
 * ощущение кувыркающегося кубика, при этом он всегда «узнаётся» (d20 остаётся d20).
 *
 * 3 вариации на номинал (можно расширить позже).
 *
 * TODO (задел): сюда же можно добавить «тематические» силуэты (монета, оружие,
 * руны) как отдельный источник кадров (FrameProvider) для подмешивания в scramble.
 */

import type { DieType } from '../model/types.ts'

const CENTER = 50
const RADIUS = 44

/** Точка на плоскости. */
interface Point {
  x: number
  y: number
}

/** Строит вершины правильного многоугольника. */
function regularPolygon(sides: number, rotationDeg: number, radius = RADIUS): Point[] {
  const points: Point[] = []
  const offset = (rotationDeg * Math.PI) / 180
  for (let i = 0; i < sides; i += 1) {
    const angle = offset + (i * 2 * Math.PI) / sides
    points.push({
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
    })
  }
  return points
}

/** Поворачивает набор точек вокруг центра на угол (в градусах). */
function rotatePoints(points: Point[], deg: number): Point[] {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return points.map(({ x, y }) => {
    const dx = x - CENTER
    const dy = y - CENTER
    return {
      x: CENTER + dx * cos - dy * sin,
      y: CENTER + dx * sin + dy * cos,
    }
  })
}

/** Переводит точки в строку для атрибута `points` у <polygon>. */
function toPointsString(points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
}

/** Кастомный силуэт-«воздушный змей» для d10. */
function kite(): Point[] {
  return [
    { x: 50, y: 6 },
    { x: 88, y: 40 },
    { x: 50, y: 94 },
    { x: 12, y: 40 },
  ]
}

/** Базовый силуэт для каждого номинала (вариация 0, без поворота). */
const BASE_SHAPES: Record<DieType, Point[]> = {
  d4: regularPolygon(3, -90), // треугольник вершиной вверх
  d6: regularPolygon(4, 45), // квадрат с горизонтальными гранями
  d8: regularPolygon(4, 0), // ромб
  d10: kite(), // «воздушный змей»
  d12: regularPolygon(5, -90), // пятиугольник вершиной вверх
  d20: regularPolygon(6, 0), // шестиугольник
  d100: regularPolygon(10, -90), // десятиугольник
}

/** Углы поворота для трёх вариаций (ощущение разных ракурсов). */
const VARIATION_ANGLES = [0, 9, -7]

/** Один «кадр» силуэта: готовая строка точек для <polygon>. */
export interface DieFrame {
  points: string
}

/**
 * Возвращает кадры (вариации силуэта) для номинала.
 * Сейчас это повороты базового силуэта; во время броска они быстро сменяются.
 */
export function getDieFrames(die: DieType): DieFrame[] {
  const base = BASE_SHAPES[die]
  return VARIATION_ANGLES.map((angle) => ({
    points: toPointsString(angle === 0 ? base : rotatePoints(base, angle)),
  }))
}

/** Сколько вариаций силуэта у номинала. */
export const FRAMES_PER_DIE = VARIATION_ANGLES.length
