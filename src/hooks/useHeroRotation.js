import { useEffect, useRef, useState } from 'react'
import { createRotation } from '../lib/shuffle.js'
import { heroTiming, heroMobileMedia } from '../config/hero-images.js'

const sourceSelection = () => `${window.innerWidth}:${window.devicePixelRatio}:${window.matchMedia(heroMobileMedia).matches}`

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
  const [environment, setEnvironment] = useState({ ready: false, reduced: true, visible: true, sourceKey: '' })
  const [unavailable, setUnavailable] = useState(false)
  const queue = useRef(null)
  const loads = useRef(new Map())
  const currentId = slides.current
  const previousId = slides.previous
  const sourceKey = environment.sourceKey

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileSource = window.matchMedia(heroMobileMedia)
    let resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    const update = () => setEnvironment({ ready: true, reduced: motion.matches, visible: !document.hidden, sourceKey: sourceSelection() })
    const onResolution = () => {
      resolution.removeEventListener('change', onResolution)
      resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      resolution.addEventListener('change', onResolution)
      update()
    }
    update()
    motion.addEventListener('change', update)
    mobileSource.addEventListener('change', update)
    resolution.addEventListener('change', onResolution)
    window.addEventListener('resize', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      motion.removeEventListener('change', update)
      mobileSource.removeEventListener('change', update)
      resolution.removeEventListener('change', onResolution)
      window.removeEventListener('resize', update)
      document.removeEventListener('visibilitychange', update)
    }
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
    // A decoded candidate from a smaller viewport does not validate a larger srcset URL.
    // Guard synchronous resize/zoom races too, before React has cleaned up this effect.
    const allowed = () => !cancelled && !document.hidden && sourceSelection() === sourceKey && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    async function prepareNext() {
      const currentImage = document.querySelector('.hero-image--current')
      if (currentImage) await currentImage.decode().catch(() => {})
      while (allowed()) {
        const nextId = queue.current.peek()
        if (nextId === null) { setUnavailable(true); return }
        const image = images.find((entry) => entry.id === nextId)
        // Include source-selection inputs so resizing can request the correct variant.
        const key = `${nextId}:${sourceKey}`
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
          if (!allowed()) return
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
  }, [running, currentId, images, sourceKey])

  useEffect(() => {
    if (previousId === null) return
    const timer = window.setTimeout(() => setSlides((value) => ({ ...value, previous: null })), heroTiming.fadeMs)
    return () => window.clearTimeout(timer)
  }, [currentId, previousId])

  return { slides, paused, setPaused, canRotate, running }
}
