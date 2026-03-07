'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function BlurRevealText({
  text,
  delay = 0,
}: {
  text: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
      animate={isInView ? { opacity: 1, filter: 'blur(0px)', y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ display: 'inline-block' }}
    >
      {text}
    </motion.span>
  )
}

export default BlurRevealText
