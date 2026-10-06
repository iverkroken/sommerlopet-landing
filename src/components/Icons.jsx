export function ArrowIcon({ diagonal = false }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="icon">
    <path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}
export function SunMark() {
  return <svg aria-hidden="true" viewBox="0 0 100 100" fill="none" className="sun-mark">
    <circle cx="50" cy="50" r="21" stroke="currentColor" strokeWidth="3" />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d="M50 6v12" stroke="currentColor" strokeWidth="3" transform={`rotate(${i * 30} 50 50)`} />)}
  </svg>
}
