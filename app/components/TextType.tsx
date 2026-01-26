'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface TextTypeProps {
  texts: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  showCursor?: boolean
  cursorCharacter?: string
  cursorBlinkDuration?: number
  variableSpeedEnabled?: boolean
  variableSpeedMin?: number
  variableSpeedMax?: number
  className?: string
  style?: React.CSSProperties
}

const TextType: React.FC<TextTypeProps> = ({
  texts,
  typingSpeed = 75,
  deletingSpeed = 50,
  pauseDuration = 1500,
  showCursor = true,
  cursorCharacter = '_',
  cursorBlinkDuration = 0.5,
  variableSpeedEnabled = false,
  variableSpeedMin = 60,
  variableSpeedMax = 120,
  className = '',
  style = {}
}) => {
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const getTypingSpeed = useCallback(() => {
    if (variableSpeedEnabled) {
      return Math.floor(Math.random() * (variableSpeedMax - variableSpeedMin + 1)) + variableSpeedMin
    }
    return typingSpeed
  }, [variableSpeedEnabled, variableSpeedMin, variableSpeedMax, typingSpeed])

  useEffect(() => {
    if (texts.length === 0) return

    const currentText = texts[textIndex]

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, pauseDuration)
      return () => clearTimeout(pauseTimer)
    }

    if (isDeleting) {
      if (displayText === '') {
        setIsDeleting(false)
        setTextIndex((prev) => (prev + 1) % texts.length)
        return
      }

      const deleteTimer = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1))
      }, deletingSpeed)
      return () => clearTimeout(deleteTimer)
    }

    if (displayText === currentText) {
      if (texts.length > 1) {
        setIsPaused(true)
      }
      return
    }

    const typeTimer = setTimeout(() => {
      setDisplayText(currentText.slice(0, displayText.length + 1))
    }, getTypingSpeed())

    return () => clearTimeout(typeTimer)
  }, [displayText, textIndex, isDeleting, isPaused, texts, pauseDuration, deletingSpeed, getTypingSpeed])

  return (
    <span className={className} style={style}>
      {displayText}
      {showCursor && (
        <span
          style={{
            animation: `blink ${cursorBlinkDuration}s step-end infinite`,
          }}
        >
          {cursorCharacter}
        </span>
      )}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  )
}

export default TextType
