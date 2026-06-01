export type { Player } from './model/types.ts'
export { LOCAL_PLAYER_ID, createLocalPlayer } from './model/types.ts'
export {
  PLAYER_CLASSES,
  isPlayerClassId,
  type PlayerClass,
  type PlayerClassId,
} from './model/classes.ts'
export { ClassIcon, type ClassIconProps } from './ui/ClassIcon.tsx'
export {
  PLAYER_PHRASES,
  DEFAULT_PHRASES,
  getClassPhrases,
  type ClassPhrases,
} from './model/phrases.ts'
