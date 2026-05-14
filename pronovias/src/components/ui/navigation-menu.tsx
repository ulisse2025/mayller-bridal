'use client'

import * as React from "react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Menu } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "COLLECTION 2026", href: "/collection" },
  { name: "ALTERATION", href: "/alteration" },
  { name: "EVENTS", href: "/events" },
  { name: "ABOUT US", href: "/about" },
  { name: "CONTACT", href: "/contact" },
]

const EXPAND_SCROLL_THRESHOLD = 80

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const containerVariants: any = {
  expanded: {
    y: 0,
    opacity: 1,
    width: "auto",
    transition: {
      y: { type: "spring", damping: 18, stiffness: 250 },
      opacity: { duration: 0.3 },
      type: "spring",
      damping: 20,
      stiffness: 300,
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
  collapsed: {
    y: 0,
    opacity: 1,
    width: "3rem",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logoVariants: any = {
  expanded: { opacity: 1, x: 0, rotate: 0, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -25, rotate: -180, transition: { duration: 0.3 } },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const itemVariants: any = {
  expanded: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collapsedIconVariants: any = {
  expanded: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  collapsed: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", damping: 15, stiffness: 300, delay: 0.15 },
  },
}

export function AnimatedNavFramer() {
  const [isExpanded, setExpanded] = React.useState(true)
  const { scrollY } = useScroll()
  const lastScrollY = React.useRef(0)
  const scrollPositionOnCollapse = React.useRef(0)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current
    if (isExpanded && latest > previous && latest > 150) {
      setExpanded(false)
      scrollPositionOnCollapse.current = latest
    } else if (
      !isExpanded &&
      latest < previous &&
      scrollPositionOnCollapse.current - latest > EXPAND_SCROLL_THRESHOLD
    ) {
      setExpanded(true)
    }
    lastScrollY.current = latest
  })

  const handleNavClick = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.preventDefault()
      setExpanded(true)
    }
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={containerVariants}
        whileHover={!isExpanded ? { scale: 1.1 } : {}}
        whileTap={!isExpanded ? { scale: 0.95 } : {}}
        onClick={handleNavClick}
        className={cn(
          "flex items-center overflow-hidden rounded-full border border-white/20 bg-black/70 shadow-lg backdrop-blur-md h-12",
          !isExpanded && "cursor-pointer justify-center"
        )}
      >
        <motion.div
          variants={logoVariants}
          className="flex-shrink-0 flex items-center font-bold text-white pl-5 pr-3 text-xs tracking-[0.25em]"
        >
          MAYLLER
        </motion.div>

        <motion.div
          className={cn(
            "flex items-center gap-1 sm:gap-3 pr-4",
            !isExpanded && "pointer-events-none"
          )}
        >
          {navItems.map((item) => (
            <motion.div key={item.name} variants={itemVariants}>
              <Link
                href={item.href}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-medium text-white/70 hover:text-white transition-colors px-2 py-1 tracking-wider whitespace-nowrap"
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
          <motion.div variants={itemVariants}>
            <Link
              href="/#appointment"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] font-semibold text-black bg-white px-4 py-1.5 tracking-wider whitespace-nowrap hover:bg-white/90 transition-colors inline-block"
            >
              BOOK
            </Link>
          </motion.div>
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div variants={collapsedIconVariants} animate={isExpanded ? "expanded" : "collapsed"}>
            <Menu className="h-5 w-5 text-white" />
          </motion.div>
        </div>
      </motion.nav>
    </div>
  )
}
