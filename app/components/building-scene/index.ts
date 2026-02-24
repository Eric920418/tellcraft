// ============================================================
// Dynamic import 包裝：3D 場景 + 2D fallback
// ============================================================

import dynamic from 'next/dynamic'
import BuildingFallback from './BuildingFallback'

export type { default as BuildingSceneType } from './BuildingScene'

export const BuildingScene = dynamic(
  () => import('./BuildingScene'),
  {
    ssr: false,
    loading: () => null,
  }
)

export { BuildingFallback }
