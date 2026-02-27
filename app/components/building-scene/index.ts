// ============================================================
// Dynamic import 包裝：BDD 需求藍圖面板
// ============================================================

import dynamic from 'next/dynamic'

export const BuildingPlayer = dynamic(
  () => import('../BddAnimationPanel'),
  { loading: () => null }
)
