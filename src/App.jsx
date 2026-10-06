import { event } from './config/event.js'
import Hero from './components/Hero.jsx'
import RegistrationLink from './components/RegistrationLink.jsx'
import { ArrowIcon, SunMark } from './components/Icons.jsx'

function Brand() {
  return event.logoSrc ? <img className="brand-logo" src={event.logoSrc} alt={`${event.titlePartner} ${event.name}`} />
    : <div className="brand"><span>{event.titlePartner}</span><strong>sommerløpet<span className="brand-period">.</span></strong></div>
}

export default function App() {
  return <>
    <a className="skip-link" href="#main">Hopp til innhold</a>
    <header className="site-header"><div className="container header-inner">
      <Brand /><p className="header-note">En sommerdag.<br /><strong>Mange små seire.</strong></p>
      <span className="header-date" aria-hidden="true">05 / 06 / 27 <span>KRISTIANSAND</span></span>
    </div></header>
    <main id="main" tabIndex={-1}>
      <Hero />
      <section className="intro section-space" aria-labelledby="intro-title"><div className="container intro-grid">
        <div><p className="eyebrow section-kicker">Sammen om opplevelsen</p><h2 id="intro-title">Hele byen heier.<br /><span>Du finner ditt tempo.</span></h2></div>
        <div className="intro-copy"><SunMark /><p>For deg som vil løpe fort. For deg som vil fullføre. Og for de minste som skal kjenne på løpegleden.</p><p>Ta med venner eller familie til en løpefest i hjertet av Kristiansand. Om du går, triller eller løper, velger du selv.</p></div>
      </div></section>
      <section className="distances section-space" aria-labelledby="distance-title"><div className="container">
        <div className="section-heading"><div><p className="eyebrow section-kicker">Små steg. Store øyeblikk.</p><h2 id="distance-title">Finn din distanse.</h2></div><p>Fra barneløp til halvmaraton.<br />Du velger distanse i påmeldingen.</p></div>
        <ul className="distance-list">{event.distances.map((distance, index) => <li key={distance.label}>
          <span className="distance-index" aria-hidden="true">0{index + 1}</span><p className="distance-value">{distance.value}<span>{distance.unit}</span></p><h3>{distance.label}</h3>
        </li>)}</ul>
      </div></section>
      <section className="closing" aria-labelledby="closing-title"><div className="container closing-inner">
        <div className="closing-copy"><p className="eyebrow">Kristiansand · {event.displayDate}</p><h2 id="closing-title">Gjør plass til<br />en sommeropplevelse.</h2><p>Vi gleder oss til å se deg på startstreken.</p></div>
        <div className="closing-action"><SunMark /><RegistrationLink /></div>
      </div></section>
    </main>
    <footer className="site-footer"><div className="container footer-inner">
      <Brand /><nav aria-label="Arrangementsinformasjon"><a href={event.officialUrl}>Praktisk info på sommerlopet.no <ArrowIcon diagonal /></a></nav><span className="footer-year">Vi ses i 2027!</span>
    </div></footer>
  </>
}
