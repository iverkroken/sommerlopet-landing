import { event } from '../config/event.js'
import { ArrowIcon } from './Icons.jsx'
export default function RegistrationLink({ compact = false }) {
  return <div className="registration">
    <a className={`button button--primary${compact ? ' button--compact' : ''}`} href={event.registrationUrl}><span>Påmelding{!compact && ` ${event.year}`}</span><ArrowIcon /></a>
  </div>
}
