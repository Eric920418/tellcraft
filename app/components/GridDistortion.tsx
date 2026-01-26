'use client'

import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

interface GridDistortionProps {
  grid?: number
  mouse?: number
  strength?: number
  relaxation?: number
  imageSrc?: string
  className?: string
  style?: React.CSSProperties
}

const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 offset = texture2D(uDataTexture, vUv);
  gl_FragColor = texture2D(uTexture, uv - 0.02 * offset.rg);
}
`

// Generate grid pattern texture using Canvas
function createGridTexture(width = 1200, height = 800): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // White background with subtle gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height)
  bgGradient.addColorStop(0, '#fafafa')
  bgGradient.addColorStop(0.5, '#ffffff')
  bgGradient.addColorStop(1, '#f5f5f5')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)

  // Draw grid lines
  ctx.strokeStyle = '#e8e8e8'
  ctx.lineWidth = 1

  const gridSize = 60
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Draw dots at intersections
  ctx.fillStyle = '#d0d0d0'
  for (let x = 0; x <= width; x += gridSize) {
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Add some decorative circles
  ctx.strokeStyle = '#e5e5e5'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(200, 200, 150, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(1000, 600, 200, 0, Math.PI * 2)
  ctx.stroke()

  // Diagonal lines
  ctx.strokeStyle = '#ebebeb'
  ctx.beginPath()
  ctx.moveTo(0, 400)
  ctx.lineTo(400, 0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(800, height)
  ctx.lineTo(width, 400)
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  return texture
}

const GridDistortion: React.FC<GridDistortionProps> = ({
  grid = 15,
  mouse = 0.1,
  strength = 0.15,
  relaxation = 0.9,
  imageSrc,
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const planeRef = useRef<THREE.Mesh | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0xffffff, 1)
    rendererRef.current = renderer

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000)
    camera.position.z = 2
    cameraRef.current = camera

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uTexture: { value: null as THREE.Texture | null },
      uDataTexture: { value: null as THREE.DataTexture | null }
    }

    const size = grid
    const data = new Float32Array(4 * size * size)
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = Math.random() * 255 - 125
      data[i * 4 + 1] = Math.random() * 255 - 125
    }

    const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType)
    dataTexture.needsUpdate = true
    uniforms.uDataTexture.value = dataTexture

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true
    })

    const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1)
    const plane = new THREE.Mesh(geometry, material)
    planeRef.current = plane
    scene.add(plane)

    // Define handleResize BEFORE using it
    const handleResize = () => {
      if (!container || !renderer || !camera) return

      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      if (width === 0 || height === 0) return

      const containerAspect = width / height

      renderer.setSize(width, height)

      if (plane) {
        plane.scale.set(containerAspect, 1, 1)
      }

      const frustumHeight = 1
      const frustumWidth = frustumHeight * containerAspect
      camera.left = -frustumWidth / 2
      camera.right = frustumWidth / 2
      camera.top = frustumHeight / 2
      camera.bottom = -frustumHeight / 2
      camera.updateProjectionMatrix()

      uniforms.resolution.value.set(width, height, 1, 1)
    }

    // Now load texture (handleResize is defined)
    if (imageSrc) {
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load(
        imageSrc,
        texture => {
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.wrapS = THREE.ClampToEdgeWrapping
          texture.wrapT = THREE.ClampToEdgeWrapping
          uniforms.uTexture.value = texture
          handleResize()
        },
        undefined,
        () => {
          // On error, fallback to canvas texture
          const fallbackTexture = createGridTexture()
          uniforms.uTexture.value = fallbackTexture
          handleResize()
        }
      )
    } else {
      const canvasTexture = createGridTexture()
      uniforms.uTexture.value = canvasTexture
      handleResize()
    }

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(container)
      resizeObserverRef.current = resizeObserver
    } else {
      window.addEventListener('resize', handleResize)
    }

    const mouseState = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vX: 0,
      vY: 0
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1 - (e.clientY - rect.top) / rect.height
      mouseState.vX = x - mouseState.prevX
      mouseState.vY = y - mouseState.prevY
      Object.assign(mouseState, { x, y, prevX: x, prevY: y })
    }

    const handleMouseLeave = () => {
      if (dataTexture) {
        dataTexture.needsUpdate = true
      }
      Object.assign(mouseState, {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vX: 0,
        vY: 0
      })
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    handleResize()

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      if (!renderer || !scene || !camera) return

      uniforms.time.value += 0.05

      if (!(dataTexture.image.data instanceof Float32Array)) {
        console.error('dataTexture.image.data is not a Float32Array')
        return
      }
      const data: Float32Array = dataTexture.image.data
      for (let i = 0; i < size * size; i++) {
        data[i * 4] *= relaxation
        data[i * 4 + 1] *= relaxation
      }

      const gridMouseX = size * mouseState.x
      const gridMouseY = size * mouseState.y
      const maxDist = size * mouse

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2)
          if (distSq < maxDist * maxDist) {
            const index = 4 * (i + size * j)
            const power = Math.min(maxDist / Math.sqrt(distSq), 10)
            data[index] += strength * 100 * mouseState.vX * power
            data[index + 1] -= strength * 100 * mouseState.vY * power
          }
        }
      }

      dataTexture.needsUpdate = true
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      } else {
        window.removeEventListener('resize', handleResize)
      }

      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)

      if (renderer) {
        renderer.dispose()
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }

      if (geometry) geometry.dispose()
      if (material) material.dispose()
      if (dataTexture) dataTexture.dispose()
      if (uniforms.uTexture.value) uniforms.uTexture.value.dispose()

      sceneRef.current = null
      rendererRef.current = null
      cameraRef.current = null
      planeRef.current = null
    }
  }, [grid, mouse, strength, relaxation, imageSrc])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        minWidth: '0',
        minHeight: '0',
        ...style
      }}
    />
  )
}

export default GridDistortion
