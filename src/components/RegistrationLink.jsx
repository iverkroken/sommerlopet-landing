import { event } from '../config/event.js'
import { ArrowIcon } from './Icons.jsx'
export default function RegistrationLink({ compact = false }) {
  return <div className={`registration ${compact ? 'registration--compact' : ''}`}>
    <a className={`button ${compact ? 'button--compact' : 'button--primary'}`} href={event.registrationUrl}><span>Meld deg på</span>{!compact && <ArrowIcon />}</a>
    {!compact && <span className="registration-note">Påmelding hos OnReg</span>}
  </div>
}
