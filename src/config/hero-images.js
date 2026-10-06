import manifest from '../generated/hero-manifest.json'

// Positions are editorial choices for each original, not device-specific layouts.
const focalPoints = {
  open: ['48% 45%', 'center 42%', 'center 37%'],
  children: ['63% 46%', 'center 45%', 'center 39%'],
  older: ['53% center', 'center 10%', 'center 10%'],
  'finish-1': ['42% 43%', 'center 20%', 'center 20%'],
  'finish-2': ['62% 42%', 'center top', 'center top'],
  'finish-3': ['52% 42%', 'center top', 'center top'],
}

// Matches .container, --hero-gap, the 40/60 split and .hero-media's 800px cap.
// Shared by the rendered image and preload(), including before hydration.
export const heroSizes = '(min-width: 64rem) min(800px, calc((min(84rem, 100vw - 2 * clamp(1rem, .5rem + 2vw, 3rem)) - clamp(1.25rem, 2vw, 2rem)) * .6)), min(800px, calc(100vw - 2 * clamp(1rem, .5rem + 2vw, 3rem)))'

export const heroImages = manifest.map(({ id, src, srcSet, width, height }) => ({
  id, src, srcSet, width, height, sizes: heroSizes, alt: '', decorative: true,
  objectPositionMobile: focalPoints[id][0],
  objectPositionDesktop: focalPoints[id][1],
  objectPositionLandscape: focalPoints[id][2],
}))

// Optional mobileSrcSet uses this same media condition for display and preloading.
export const heroMobileMedia = '(max-width: 47.99rem)'
export const heroTiming = { intervalMs: 6000, fadeMs: 800 }
