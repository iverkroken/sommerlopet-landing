import { event } from '../config/event.js'
import { ArrowIcon } from './Icons.jsx'
export default function RegistrationLink() {
  return <div className="registration">
    <a className="button button--primary" href={event.registrationUrl}>Meld deg på <ArrowIcon /></a>
    <span className="registration-note">Påmelding hos OnReg</span>
  </div>
}
