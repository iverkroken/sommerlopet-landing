import { useRef } from 'react'
import { event } from './config/event.js'
import { useScrollReveal } from './hooks/useScrollReveal.js'
import Hero from './components/Hero.jsx'
import RegistrationLink from './components/RegistrationLink.jsx'
import { ArrowIcon, CalendarIcon } from './components/Icons.jsx'
import logo from './images/sommerløpet-logo.png'

export default function App() {
  const main = useRef(null)
  const footer = useRef(null)
  useScrollReveal(main)
  useScrollReveal(footer)
  return <>
    <a className="skip-link" href="#main">Hopp til innhold</a>
    <header className="site-header"><div className="container header-inner">
      <img className="brand-logo" src={logo} width="900" height="168" alt={`${event.titlePartner} ${event.name}`} />
      <RegistrationLink compact />
    </div></header>
    <main id="main" tabIndex={-1} ref={main}>
      <Hero />
      <section className="distances section-space" aria-labelledby="distance-title"><div className="container distance-container">
        <div className="section-heading"><div data-reveal="heading"><p className="eyebrow section-kicker">Hva passer for deg?</p><h2 id="distance-title">Finn din distanse.</h2></div><p data-reveal="text">Fra barneløp til halvmaraton.<br />Du velger distanse i påmeldingen.</p></div>
        <ul className="distance-list">{event.distances.map((distance, index) => <li key={distance.label} data-reveal="distance" style={{ '--reveal-index': index }}>
          <a className="distance-card" href={distance.url}><span className="distance-index" aria-hidden="true">0{index + 1}</span><p className="distance-value">{distance.value}<span>{distance.unit}</span></p><h3>{distance.label}</h3><span className="distance-more">Les mer <ArrowIcon /></span></a>
        </li>)}</ul>
      </div></section>
    </main>
    <footer className="campaign-footer" ref={footer}><div className="footer-decoration" aria-hidden="true" /><div className="container campaign-footer-inner">
      {/* TODO: Replace this plain text with a supplied official standalone Sparebanken Norge SVG/PNG. Do not crop or recreate the combined event logo. */}
      <p className="partner-brand">Sparebanken<br />Norge</p>
      <div className="campaign-date"><CalendarIcon /><p><time dateTime={event.date}>{event.displayDate}</time><strong>{event.location}</strong></p></div>
      <p className="campaign-greeting">Vi ses på<br /> startstreken.</p>
      <nav className="campaign-actions" aria-label="Praktisk informasjon">
        <div data-reveal="cta"><a className="button practical-link" href={event.officialUrl}><span>Praktisk info</span><ArrowIcon diagonal /></a></div>
      </nav>
    </div></footer>
  </>
}
