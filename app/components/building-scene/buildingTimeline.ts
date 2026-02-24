// ============================================================
// GSAP Timeline 定義：30 題對應 6 輪建造階段
// 純邏輯，無 React 依賴
// ============================================================

import gsap from 'gsap'
import type { Object3D, Mesh, MeshStandardMaterial } from 'three'

export interface BuildingRefs {
  // Round 1: 地基
  ground: Object3D
  foundations: Object3D[]
  // Round 2: 牆體
  walls: Object3D[]
  // Round 3: 門窗
  doors: Object3D[]
  windows: Object3D[]
  // Round 4: 內裝（上色）
  colorTargets: Mesh[]
  decorations: Object3D[]
  // Round 5: 屋頂
  roof: Object3D
  chimney: Object3D
  // Round 6: 完工
  lights: Object3D[]
  trees: Object3D[]
  particles: Object3D | null
}

function setInitialState(obj: Object3D, props: { y?: number; scale?: number; opacity?: number }) {
  if (props.y !== undefined) obj.position.y = props.y
  if (props.scale !== undefined) {
    obj.scale.set(props.scale, props.scale, props.scale)
  }
  if (props.opacity !== undefined && 'material' in obj) {
    const mat = (obj as Mesh).material as MeshStandardMaterial
    if (mat) {
      mat.transparent = true
      mat.opacity = props.opacity
    }
  }
}

export function createBuildingTimeline(refs: BuildingRefs): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true })

  // ============================================
  // Round 1: 地基（q1-q5）
  // ============================================
  tl.addLabel('q1')
  setInitialState(refs.ground, { scale: 0 })
  tl.to(refs.ground.scale, {
    x: 1, y: 1, z: 1,
    duration: 0.6,
    ease: 'back.out(1.4)',
  })

  tl.addLabel('q2')
  if (refs.foundations[0]) {
    setInitialState(refs.foundations[0], { y: -2, scale: 0.8 })
    tl.to(refs.foundations[0].position, { y: 0, duration: 0.4, ease: 'power2.out' })
    tl.to(refs.foundations[0].scale, { x: 1, y: 1, z: 1, duration: 0.3 }, '<')
  }

  tl.addLabel('q3')
  if (refs.foundations[1]) {
    setInitialState(refs.foundations[1], { y: -2, scale: 0.8 })
    tl.to(refs.foundations[1].position, { y: 0, duration: 0.4, ease: 'power2.out' })
    tl.to(refs.foundations[1].scale, { x: 1, y: 1, z: 1, duration: 0.3 }, '<')
  }

  tl.addLabel('q4')
  if (refs.foundations[2]) {
    setInitialState(refs.foundations[2], { y: -2, scale: 0.8 })
    tl.to(refs.foundations[2].position, { y: 0, duration: 0.4, ease: 'power2.out' })
    tl.to(refs.foundations[2].scale, { x: 1, y: 1, z: 1, duration: 0.3 }, '<')
  }

  tl.addLabel('q5')
  if (refs.foundations[3]) {
    setInitialState(refs.foundations[3], { y: -2, scale: 0.8 })
    tl.to(refs.foundations[3].position, { y: 0, duration: 0.4, ease: 'power2.out' })
    tl.to(refs.foundations[3].scale, { x: 1, y: 1, z: 1, duration: 0.3 }, '<')
  }

  // ============================================
  // Round 2: 牆體（q6-q10）
  // ============================================
  tl.addLabel('q6')
  if (refs.walls[0]) {
    refs.walls[0].scale.y = 0
    tl.to(refs.walls[0].scale, { y: 1, duration: 0.5, ease: 'power2.out' })
  }

  tl.addLabel('q7')
  if (refs.walls[1]) {
    refs.walls[1].scale.y = 0
    tl.to(refs.walls[1].scale, { y: 1, duration: 0.5, ease: 'power2.out' })
  }

  tl.addLabel('q8')
  if (refs.walls[2]) {
    refs.walls[2].scale.y = 0
    tl.to(refs.walls[2].scale, { y: 1, duration: 0.5, ease: 'power2.out' })
  }

  tl.addLabel('q9')
  if (refs.walls[3]) {
    refs.walls[3].scale.y = 0
    tl.to(refs.walls[3].scale, { y: 1, duration: 0.5, ease: 'power2.out' })
  }

  tl.addLabel('q10')
  // 牆體完成的額外效果：微震
  refs.walls.forEach(w => {
    if (w) {
      tl.to(w.position, { y: '+=0.05', duration: 0.1, ease: 'power2.out' }, '<')
      tl.to(w.position, { y: '-=0.05', duration: 0.1, ease: 'power2.in' })
    }
  })

  // ============================================
  // Round 3: 門窗（q11-q15）
  // ============================================
  tl.addLabel('q11')
  if (refs.doors[0]) {
    setInitialState(refs.doors[0], { scale: 0 })
    tl.to(refs.doors[0].scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(2)' })
  }

  tl.addLabel('q12')
  if (refs.windows[0]) {
    setInitialState(refs.windows[0], { scale: 0 })
    tl.to(refs.windows[0].scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(2)' })
  }

  tl.addLabel('q13')
  if (refs.windows[1]) {
    setInitialState(refs.windows[1], { scale: 0 })
    tl.to(refs.windows[1].scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(2)' })
  }

  tl.addLabel('q14')
  if (refs.windows[2]) {
    setInitialState(refs.windows[2], { scale: 0 })
    tl.to(refs.windows[2].scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(2)' })
  }

  tl.addLabel('q15')
  if (refs.windows[3]) {
    setInitialState(refs.windows[3], { scale: 0 })
    tl.to(refs.windows[3].scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(2)' })
  }

  // ============================================
  // Round 4: 內裝/上色（q16-q20）
  // ============================================
  tl.addLabel('q16')
  // 逐個上色
  refs.colorTargets.forEach((mesh, i) => {
    const label = `q${16 + Math.min(i, 4)}`
    if (i > 0 && i <= 4) tl.addLabel(label)
    const mat = mesh.material as MeshStandardMaterial
    if (mat) {
      tl.to(mat, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.inOut',
      }, i === 0 ? undefined : '<+=0.1')
    }
  })
  // 確保 q17-q20 都有 label
  for (let i = 17; i <= 20; i++) {
    if (!tl.labels[`q${i}`]) tl.addLabel(`q${i}`)
  }

  // 裝飾元素
  refs.decorations.forEach((dec, i) => {
    setInitialState(dec, { scale: 0 })
    tl.to(dec.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.3,
      ease: 'back.out(1.7)',
    }, `q${18 + Math.min(i, 2)}`)
  })

  // ============================================
  // Round 5: 屋頂（q21-q25）
  // ============================================
  tl.addLabel('q21')
  setInitialState(refs.roof, { y: 5, scale: 0.5 })
  tl.to(refs.roof.position, { y: refs.roof.userData.targetY ?? 2.5, duration: 0.8, ease: 'bounce.out' })
  tl.to(refs.roof.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'power2.out' }, '<')

  tl.addLabel('q22')
  tl.addLabel('q23')
  setInitialState(refs.chimney, { y: 5, scale: 0 })
  tl.to(refs.chimney.position, { y: refs.chimney.userData.targetY ?? 3.5, duration: 0.5, ease: 'power2.out' })
  tl.to(refs.chimney.scale, { x: 1, y: 1, z: 1, duration: 0.4 }, '<')

  tl.addLabel('q24')
  tl.addLabel('q25')

  // ============================================
  // Round 6: 完工（q26-q30）
  // ============================================
  tl.addLabel('q26')
  refs.lights.forEach((light, i) => {
    setInitialState(light, { scale: 0 })
    tl.to(light.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.4,
      ease: 'back.out(2)',
    }, i === 0 ? undefined : '<+=0.15')
  })

  tl.addLabel('q27')
  tl.addLabel('q28')
  refs.trees.forEach((tree, i) => {
    setInitialState(tree, { scale: 0, y: -1 })
    tl.to(tree.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.5,
      ease: 'back.out(1.7)',
    }, `q${28 + Math.min(i, 1)}`)
    tl.to(tree.position, {
      y: tree.userData.targetY ?? 0,
      duration: 0.4,
      ease: 'power2.out',
    }, '<')
  })

  tl.addLabel('q29')
  tl.addLabel('q30')
  // 完工慶祝 — 粒子效果由 React 側控制

  return tl
}

/**
 * 根據已回答題數跳轉到對應的 timeline label
 */
export function seekToQuestion(tl: gsap.core.Timeline, questionNumber: number) {
  const label = `q${Math.max(1, Math.min(30, questionNumber))}`
  if (tl.labels[label] !== undefined) {
    tl.tweenTo(label, { duration: 0.8, ease: 'power2.inOut' })
  }
}
