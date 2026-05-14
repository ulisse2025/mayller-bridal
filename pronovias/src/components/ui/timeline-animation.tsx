'use client'

import React, { useRef, useEffect, useState, ElementType } from 'react'
import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TimelineContentProps {
  children: React.ReactNode
  className?: string
  as?: ElementType
  animationNum?: number
  timelineRef?: React.RefObject<HTMLDivElement | null>
  customVariants?: Variants
}

export function TimelineContent({
  children,
  className,
  animationNum = 0,
  customVariants,
}: TimelineContentProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const defaultVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.6, delay: animationNum * 0.1 },
    },
  }

  return (
    <motion.div
      ref={ref}
      custom={animationNum}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={customVariants || defaultVariants}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
