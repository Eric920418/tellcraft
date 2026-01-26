'use client'

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { motion, AnimatePresence, Transition } from 'framer-motion'

export interface RotatingTextRef {
  next: () => void
  previous: () => void
  jumpTo: (index: number) => void
  reset: () => void
}

export interface RotatingTextProps {
  texts: string[]
  transition?: Transition
  initial?: { y?: string | number; opacity?: number }
  animate?: { y?: string | number; opacity?: number }
  exit?: { y?: string | number; opacity?: number }
  rotationInterval?: number
  staggerDuration?: number
  staggerFrom?: 'first' | 'last' | 'center' | number
  loop?: boolean
  auto?: boolean
  splitBy?: 'characters' | 'words'
  onNext?: (index: number) => void
  className?: string
  style?: React.CSSProperties
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
  (
    {
      texts,
      transition = { type: 'spring', damping: 25, stiffness: 300 },
      initial = { y: '100%', opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: '-120%', opacity: 0 },
      rotationInterval = 2000,
      staggerDuration = 0.02,
      staggerFrom = 'first',
      loop = true,
      auto = true,
      splitBy = 'characters',
      onNext,
      className = '',
      style = {}
    },
    ref
  ) => {
    const [currentTextIndex, setCurrentTextIndex] = useState<number>(0)

    const splitIntoCharacters = (text: string): string[] => {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('zh-TW', { granularity: 'grapheme' })
        return Array.from(segmenter.segment(text), segment => segment.segment)
      }
      return Array.from(text)
    }

    const elements = useMemo(() => {
      const currentText = texts[currentTextIndex]
      if (splitBy === 'characters') {
        const words = currentText.split(' ')
        return words.map((word, i) => ({
          characters: splitIntoCharacters(word),
          needsSpace: i !== words.length - 1
        }))
      }
      return currentText.split(' ').map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1
      }))
    }, [texts, currentTextIndex, splitBy])

    const getStaggerDelay = useCallback(
      (index: number, totalChars: number): number => {
        if (staggerFrom === 'first') return index * staggerDuration
        if (staggerFrom === 'last') return (totalChars - 1 - index) * staggerDuration
        if (staggerFrom === 'center') {
          const center = Math.floor(totalChars / 2)
          return Math.abs(center - index) * staggerDuration
        }
        return Math.abs((staggerFrom as number) - index) * staggerDuration
      },
      [staggerFrom, staggerDuration]
    )

    const handleIndexChange = useCallback(
      (newIndex: number) => {
        setCurrentTextIndex(newIndex)
        if (onNext) onNext(newIndex)
      },
      [onNext]
    )

    const next = useCallback(() => {
      const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1
      if (nextIndex !== currentTextIndex) handleIndexChange(nextIndex)
    }, [currentTextIndex, texts.length, loop, handleIndexChange])

    const previous = useCallback(() => {
      const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1
      if (prevIndex !== currentTextIndex) handleIndexChange(prevIndex)
    }, [currentTextIndex, texts.length, loop, handleIndexChange])

    const jumpTo = useCallback(
      (index: number) => {
        const validIndex = Math.max(0, Math.min(index, texts.length - 1))
        if (validIndex !== currentTextIndex) handleIndexChange(validIndex)
      },
      [texts.length, currentTextIndex, handleIndexChange]
    )

    const reset = useCallback(() => {
      if (currentTextIndex !== 0) handleIndexChange(0)
    }, [currentTextIndex, handleIndexChange])

    useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset])

    useEffect(() => {
      if (!auto) return
      const intervalId = setInterval(next, rotationInterval)
      return () => clearInterval(intervalId)
    }, [next, rotationInterval, auto])

    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      flexWrap: 'wrap',
      whiteSpace: 'pre-wrap',
      position: 'relative',
      ...style
    }

    return (
      <motion.span className={className} style={baseStyle} layout transition={transition}>
        {/* SR-only for accessibility */}
        <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          {texts[currentTextIndex]}
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentTextIndex}
            style={{ display: 'inline-flex', flexWrap: 'wrap', whiteSpace: 'pre-wrap', position: 'relative' }}
            layout
            aria-hidden="true"
          >
            {elements.map((wordObj, wordIndex, array) => {
              const previousCharsCount = array
                .slice(0, wordIndex)
                .reduce((sum, word) => sum + word.characters.length, 0)
              const totalChars = array.reduce((sum, word) => sum + word.characters.length, 0)

              return (
                <span key={wordIndex} style={{ display: 'inline-flex' }}>
                  {wordObj.characters.map((char, charIndex) => (
                    <motion.span
                      key={charIndex}
                      initial={initial}
                      animate={animate}
                      exit={exit}
                      transition={{
                        ...transition,
                        delay: getStaggerDelay(previousCharsCount + charIndex, totalChars)
                      }}
                      style={{ display: 'inline-block' }}
                    >
                      {char}
                    </motion.span>
                  ))}
                  {wordObj.needsSpace && <span style={{ whiteSpace: 'pre' }}> </span>}
                </span>
              )
            })}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    )
  }
)

RotatingText.displayName = 'RotatingText'
export default RotatingText
