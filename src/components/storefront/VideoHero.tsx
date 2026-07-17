'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { brand } from '@/config/brand'

/**
 * Full-screen cinematic hero with a looping background video, gradient overlays,
 * staggered Framer Motion entrance animations, and a sticky stacking-panel
 * layout so the next content section slides UP over the hero as you scroll.
 *
 * Technique: The hero panel is `lg:sticky lg:top-0` with z-index:1.
 * The sibling content panel has z-index:2 and slides over the hero naturally
 * as the user scrolls — exactly like https://road-milling-rental.vercel.app.
 */

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

export function VideoHero() {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  // Parallax: video shifts slightly as user scrolls
  const { scrollY } = useScroll()
  const videoY = useTransform(scrollY, [0, 800], [0, 200])
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const contentY = useTransform(scrollY, [0, 500], [0, 80])

  // Stagger config
  const stagger = 0.15
  const dur = reduce ? 0 : 0.9

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink pt-16 sm:pt-20 lg:min-h-screen"
    >
      {/* Background Video with parallax */}
      <motion.div
        className="absolute inset-0"
        style={{ y: reduce ? 0 : videoY }}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/videos/hero-poster.jpg"
        >
          <source src="/videos/hero (2).mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Gradient overlays for text readability — matches reference site */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/35 to-ink/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-ink/10" />

      {/* Subtle dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content — fades out as user scrolls */}
      <motion.div
        className="mx-auto w-full max-w-7xl px-5 sm:px-8 relative z-10"
        style={reduce ? {} : { opacity: contentOpacity, y: contentY }}
      >
        {/* Badge */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: stagger * 0, ease: EASE }}
        >
          <p className="mb-5 inline-flex items-center gap-2 border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            New Season · Premium Collection
          </p>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="max-w-4xl text-balance font-serif text-4xl font-light leading-[1.08] text-white sm:text-6xl lg:text-7xl"
          initial={reduce ? {} : { opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur * 1.2, delay: stagger * 1, ease: EASE }}
        >
          Quietly premium clothing,{' '}
          <span className="relative inline-block">
            made to be lived in
            <motion.span
              className="absolute -bottom-1 left-0 h-[2px] w-full bg-accent"
              initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: stagger * 5, ease: EASE }}
              style={{ originX: 0 }}
            />
          </span>
          .
        </motion.h1>

        {/* Description */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: stagger * 2.5, ease: EASE }}
        >
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            {brand.description}. Explore a tightly edited range — modern
            silhouettes in a restrained, neutral palette.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: stagger * 3.5, ease: EASE }}
        >
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <div className="inline-block">
              <Link
                href="/shop"
                className="group inline-flex items-center justify-center gap-2 bg-accent px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03] hover:bg-accent-hover hover:shadow-[0_16px_34px_-10px_rgba(138,106,79,0.65)] active:translate-y-0 active:scale-100"
              >
                Shop the Collection
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
            </div>
            <div className="inline-block">
              <Link
                href="/shop?sort=new"
                className="group inline-flex items-center justify-center gap-2 border border-white/30 bg-transparent px-7 py-3.5 text-sm font-medium uppercase tracking-wider text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03] hover:border-accent hover:text-accent hover:shadow-lg active:translate-y-0 active:scale-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                New Arrivals
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2"
        initial={reduce ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: stagger * 6, ease: EASE }}
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">
          Scroll to explore
        </span>
        <motion.div
          animate={reduce ? {} : { y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade into next panel */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-ink to-transparent" />
    </section>
  )
}
