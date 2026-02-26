// ============================================================
// Dynamic import 包裝："The Craft" 鍛造動畫面板
// ============================================================

import dynamic from 'next/dynamic'

export const BuildingPlayer = dynamic(
  () => import('../BddAnimationPanel'),
  {
    ssr: false,
    loading: () => null,
  }
)
