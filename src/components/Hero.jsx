import { useEffect, useState } from 'react'
import { event } from '../config/event.js'
import { heroImages, heroTiming } from '../config/hero-images.js'
import RegistrationLink from './RegistrationLink.jsx'

function preload(image) {
  return new Promise((resolve, reject) => {
    const next = new Image()
    next.onload = () => next.decode().then(resolve, reject)
    next.onerror = reject
    next.sizes = image.sizes || '100vw'
    const source = window.matchMedia('(max-width: 767px)').matches && image.mobileSrcSet ? image.mobileSrcSet : image.srcSet
    if (source) next.srcset = source
    next.src = image.src
  })
}

function HeroImage({ image, current, animated }) {
  return <picture
    className={`hero-picture ${current ? 'hero-picture--current' : 'hero-picture--previous'} ${animated ? 'hero-picture--enter' : ''}`}
    aria-hidden={!current || image.decorative ? true : undefined}
    style={{ '--focal-mobile': image.objectPositionMobile, '--focal-desktop': image.objectPositionDesktop }}
  >
    {image.mobileSrcSet && <source media="(max-width: 767px)" srcSet={image.mobileSrcSet} sizes={image.sizes || '100vw'} />}
    <img className={current ? 'hero-image--current' : undefined} src={image.src} srcSet={image.srcSet}
      sizes={image.srcSet ? image.sizes || '100vw' : undefined} alt={image.decorative ? '' : image.alt}
      fetchPriority={current ? 'high' : 'auto'} decoding="async"
      onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
  </picture>
}

export default function Hero({ images = heroImages }) {
  const [slides, setSlides] = useState({ current: 0, previous: null })
  const [paused, setPaused] = useState(false)
  const [environment, setEnvironment] = useState({ ready: false, reduced: true, visible: true })
  const [unavailable, setUnavailable] = useState(false)
  const currentIndex = slides.current
  const previousIndex = slides.previous
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
    let cancelled = false
    let timer
    const started = performance.now()
    async function prepareNext() {
      const currentImage = document.querySelector('.hero-image--current')
      if (currentImage) await currentImage.decode().catch(() => {})
      for (let offset = 1; offset < images.length; offset++) {
        if (cancelled) return
        const index = (currentIndex + offset) % images.length
        try {
          await preload(images[index])
          if (cancelled) return
          timer = window.setTimeout(() => setSlides({ current: index, previous: currentIndex }),
            Math.max(0, heroTiming.intervalMs - (performance.now() - started)))
          return
        } catch { /* Keep a working photo if the next one fails. */ }
      }
      if (!cancelled) setUnavailable(true)
    }
    prepareNext()
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [running, currentIndex, images])
  useEffect(() => {
    if (previousIndex === null) return
    const timer = window.setTimeout(() => setSlides((value) => ({ ...value, previous: null })), heroTiming.fadeMs)
    return () => window.clearTimeout(timer)
  }, [currentIndex, previousIndex])

  return <section className={`hero ${running ? '' : 'hero--static'}`} aria-labelledby="hero-title" style={{ '--hero-fade': `${heroTiming.fadeMs}ms` }}>
    <div className="hero-visual">
      {slides.previous !== null && images[slides.previous] && <HeroImage key={`previous-${slides.previous}`} image={images[slides.previous]} current={false} />}
      {images[slides.current] && <HeroImage key={slides.current} image={images[slides.current]} current animated={slides.previous !== null && running} />}
    </div>
    <div className="hero-shade" />
    <div className="container hero-layout">
      <div className="hero-content">
        <p className="eyebrow hero-eyebrow"><span className="live-dot" /> En løpefest for små og store</p>
        <h1 id="hero-title">{event.name}{' '}<span>{event.year}</span></h1>
        <p className="hero-description">Sommer i byen. Folk i gatene.<br />En dag å glede seg til.</p>
        <p className="hero-details"><time dateTime={event.date}>{event.displayDate}</time><span aria-hidden="true" className="detail-divider" /><span>{event.location}</span></p>
        <RegistrationLink />
      </div>
      <div className="hero-aside" aria-hidden="true"><span>Vi ses på<br />startstreken.</span><span className="hand-arrow">↙</span></div>
    </div>
    <div className="container hero-bottom">
      <span className="hero-bottom-note">Ditt tempo. Din sommer.</span>
      {canRotate && <button className="motion-control" type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Start bildebytte' : 'Sett bildebytte på pause'}>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor">{paused ? <path d="m5 3 8 5-8 5Z" /> : <path d="M4 3h3v10H4zm5 0h3v10H9z" />}</svg>
        <span>{paused ? 'Start bildebytte' : 'Sett bildebytte på pause'}</span>
      </button>}
    </div>
  </section>
}
