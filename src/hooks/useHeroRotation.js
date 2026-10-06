import { useEffect, useRef, useState } from 'react'
import { createRotation } from '../lib/shuffle.js'
import { heroTiming, heroMobileMedia } from '../config/hero-images.js'

function preload(image) {
  const source = window.matchMedia(heroMobileMedia).matches && image.mobileSrcSet ? image.mobileSrcSet : image.srcSet
  return new Promise((resolve, reject) => {
    const next = new Image()
    next.fetchPriority = 'low'
    next.onload = () => next.decode().then(resolve, reject)
    next.onerror = reject
    next.sizes = image.sizes || '100vw'
    if (source) next.srcset = source
    next.src = image.src
  })
}

export function useHeroRotation(images) {
  const [slides, setSlides] = useState({ current: images[0]?.id ?? null, previous: null })
  const [paused, setPaused] = useState(false)
  const [environment, setEnvironment] = useState({ ready: false, reduced: true, visible: true })
  const [unavailable, setUnavailable] = useState(false)
  const queue = useRef(null)
  const loads = useRef(new Map())
  const currentId = slides.current
  const previousId = slides.previous

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setEnvironment({ ready: true, reduced: motion.matches, visible: !document.hidden })
    update()
    motion.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    return () => { motion.removeEventListener('change', update); document.removeEventListener('visibilitychange', update) }
  }, [])

  const canRotate = environment.ready && !environment.reduced && images.length > 1 && !unavailable
  const running = canRotate && !paused && environment.visible
  useEffect(() => {
    if (!running) return
    if (!queue.current) queue.current = createRotation(images.map((image) => image.id), currentId)
    let cancelled = false
    let timer
    let idle
    const started = performance.now()
    const allowed = () => !cancelled && !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    async function prepareNext() {
      const currentImage = document.querySelector('.hero-image--current')
      if (currentImage) await currentImage.decode().catch(() => {})
      while (allowed()) {
        const nextId = queue.current.peek()
        if (nextId === null) { setUnavailable(true); return }
        const image = images.find((entry) => entry.id === nextId)
        // Include source-selection inputs so resizing can request the correct variant.
        const key = `${nextId}:${window.innerWidth}:${window.devicePixelRatio}`
        try {
          if (!loads.current.has(key)) loads.current.set(key, preload(image))
          await loads.current.get(key)
          if (!allowed()) return
          timer = window.setTimeout(() => {
            if (!allowed()) return
            queue.current.commit(nextId)
            setSlides({ current: nextId, previous: currentId })
          }, Math.max(0, heroTiming.intervalMs - (performance.now() - started)))
          return
        } catch {
          if (cancelled) return
          queue.current.exclude(nextId)
        }
      }
    }

    const schedule = () => {
      if (!allowed()) return
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(prepareNext, { timeout: 1000 })
      else timer = window.setTimeout(prepareNext, 100)
    }
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (idle !== undefined) window.cancelIdleCallback(idle)
      window.removeEventListener('load', schedule)
    }
  }, [running, currentId, images])

  useEffect(() => {
    if (previousId === null) return
    const timer = window.setTimeout(() => setSlides((value) => ({ ...value, previous: null })), heroTiming.fadeMs)
    return () => window.clearTimeout(timer)
  }, [currentId, previousId])

  return { slides, paused, setPaused, canRotate, running }
}
