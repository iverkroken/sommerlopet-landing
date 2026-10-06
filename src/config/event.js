// Confirmed against sommerlopet.no and OnReg event 7837, 6 October 2026.
export const event = {
  name: 'Sommerløpet', titlePartner: 'Sparebanken Norge', year: '2027',
  date: '2027-06-05', displayDate: '5. juni 2027', location: 'Kristiansand',
  registrationUrl: 'https://secure.onreg.com/onreg2/front/step1.php?id=7837',
  officialUrl: 'https://sommerlopet.no/',
  // TODO: Add the supplied official logo as a local asset, then set this path.
  logoSrc: null,
  distances: [
    { value: '600', unit: 'm', label: 'Barneløpet' },
    { value: '3', unit: 'km', label: 'Sommerjoggen' },
    { value: '5', unit: 'km', label: '5 kilometer' },
    { value: '10', unit: 'km', label: '10 kilometer' },
    { value: '21', unit: 'km', label: 'Halvmaraton' },
  ],
}
