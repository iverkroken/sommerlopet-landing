import { event } from '../config/event.js'
import { heroImages, heroTiming, heroMobileMedia } from '../config/hero-images.js'
import { useHeroRotation } from '../hooks/useHeroRotation.js'
import RegistrationLink from './RegistrationLink.jsx'

function HeroImage({ image, current, animated }) {
  return <picture
    className={`hero-picture ${current ? 'hero-picture--current' : 'hero-picture--previous'} ${animated ? 'hero-picture--enter' : ''}`}
    aria-hidden={!current || image.decorative ? true : undefined}
    style={{ '--focal-mobile': image.objectPositionMobile, '--focal-desktop': image.objectPositionDesktop,
      '--focal-landscape': image.objectPositionLandscape || image.objectPositionDesktop }}
  >
    {image.mobileSrcSet && <source media={heroMobileMedia} srcSet={image.mobileSrcSet} sizes={image.sizes} />}
    <img className={current ? 'hero-image--current' : undefined} data-image-id={image.id}
      src={image.src} srcSet={image.srcSet} sizes={image.sizes} width={image.width} height={image.height}
      alt={image.decorative ? '' : image.alt} fetchPriority={current ? 'high' : 'auto'} decoding="async"
      onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
  </picture>
}

export default function Hero({ images = heroImages }) {
  const { slides, running, canRotate, paused, setPaused } = useHeroRotation(images)
  const current = images.find((image) => image.id === slides.current)
  const previous = images.find((image) => image.id === slides.previous)
  const controlLabel = paused ? 'Start bildebytte' : 'Pause bildebytte'

  return <section className={`hero ${running ? '' : 'hero--static'}`} aria-labelledby="hero-title" style={{ '--hero-fade': `${heroTiming.fadeMs}ms` }}>
    <div className="hero-visual">
      {previous && <HeroImage key={`previous-${previous.id}`} image={previous} current={false} />}
      {current && <HeroImage key={current.id} image={current} current animated={!!previous && running} />}
    </div>
    <div className="hero-shade" />
    <div className="container hero-layout">
      <div className="hero-content">
        <p className="eyebrow hero-eyebrow"><span className="live-dot" /> En løpefest for små og store</p>
        <h1 id="hero-title">{event.name === 'Sommerløpet' ? <>Sommer<wbr />løpet</> : event.name}{' '}<span>{event.year}</span></h1>
        <p className="hero-description">Sommer i byen. Folk i gatene.<br />En dag å glede seg til.</p>
        <p className="hero-details"><time dateTime={event.date}>{event.displayDate}</time><span aria-hidden="true" className="detail-divider" /><span>{event.location}</span></p>
        <RegistrationLink />
      </div>
    </div>
    <div className="container hero-bottom">
      <span className="hero-bottom-note">Ditt tempo. Din sommer.</span>
      <div className="motion-control-slot">
        {canRotate && <button className="motion-control" type="button" onClick={() => setPaused((value) => !value)} aria-label={controlLabel} title={controlLabel}>
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor">{paused ? <path d="m5 3 8 5-8 5Z" /> : <path d="M4 3h3v10H4zm5 0h3v10H9z" />}</svg>
        </button>}
      </div>
    </div>
  </section>
}
