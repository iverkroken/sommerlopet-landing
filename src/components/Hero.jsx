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
  const { slides, running } = useHeroRotation(images)
  const current = images.find((image) => image.id === slides.current)
  const previous = images.find((image) => image.id === slides.previous)

  return <section className={`hero ${running ? '' : 'hero--static'}`} aria-labelledby="hero-title" style={{ '--hero-fade': `${heroTiming.fadeMs}ms` }}>
    <div className="container hero-layout">
      <div className="hero-content">
        <p className="eyebrow hero-eyebrow">En løpefest for alle</p>
        <h1 id="hero-title">{event.name === 'Sommerløpet' ? <>Sommer<wbr />løpet</> : event.name}{' '}<span className="hero-year">{event.year}</span></h1>
        <p className="hero-statement">5. juni fyller vi Kristiansand med løpeglede.</p>
        <p className="hero-description">Ta med noen du er glad i. Finn din distanse og bli med på løpefesten!</p>
        <RegistrationLink />
        <p className="eyebrow hero-details"><time dateTime={event.date}>{event.displayDate}</time> · {event.location}</p>
      </div>
      <div className="hero-media">
        <div className="hero-visual">
          {previous && <HeroImage key={`previous-${previous.id}`} image={previous} current={false} />}
          {current && <HeroImage key={current.id} image={current} current animated={!!previous && running} />}
        </div>
      </div>
    </div>
  </section>
}
