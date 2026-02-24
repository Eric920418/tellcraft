// ============================================================
// Dynamic import 包裝：Remotion 3D Player + 2D fallback
// ============================================================

import dynamic from 'next/dynamic'

export const BuildingPlayer = dynamic(
  () => import('./BuildingPlayer'),
  {
    ssr: false,
    loading: () => null,
  }
)
