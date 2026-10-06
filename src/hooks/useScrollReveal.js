import { useEffect } from 'react'

// Visible by default: an observer adds a finite animation, never a hidden wait state.
export function useScrollReveal(root) {
  useEffect(() => {
    const scope = root.current
    if (!scope || !('IntersectionObserver' in window)) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const elements = [...scope.querySelectorAll('[data-reveal]')]
    const seen = new WeakSet()
    let observer
    const finish = (element) => {
      element.classList.remove('is-revealing')
      seen.add(element)
      observer?.unobserve(element)
    }
    const onEnd = (event) => { if (event.target.matches('[data-reveal]')) finish(event.target) }
    const onFocus = (event) => {
      const element = event.target.closest('[data-reveal]')
      if (element) finish(element)
    }
    const setup = () => {
      observer?.disconnect()
      elements.forEach((element) => element.classList.remove('is-revealing'))
      if (media.matches) return
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || seen.has(entry.target)) continue
          entry.target.classList.add('is-revealing')
          seen.add(entry.target)
          observer.unobserve(entry.target)
        }
      }, { rootMargin: '0px 0px 32px 0px', threshold: 0 })
      for (const element of elements) {
        if (element.getBoundingClientRect().top < window.innerHeight) seen.add(element)
        if (!seen.has(element)) observer.observe(element)
      }
    }
    setup()
    media.addEventListener('change', setup)
    scope.addEventListener('animationend', onEnd)
    scope.addEventListener('focusin', onFocus)
    return () => {
      observer?.disconnect()
      media.removeEventListener('change', setup)
      scope.removeEventListener('animationend', onEnd)
      scope.removeEventListener('focusin', onFocus)
      elements.forEach((element) => element.classList.remove('is-revealing'))
    }
  }, [root])
}
