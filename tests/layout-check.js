// Geometry assertions catch the previous 3+1+1 / 4+1 composition bug even without overflow.
export async function layoutProblems(page, { isolatedDistanceGrid = false } = {}) {
  return page.evaluate(({ isolatedDistanceGrid }) => {
    const issues = []
    const rect = (node) => node.getBoundingClientRect()
    const overlap = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1
    if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('document overflow')
    const list = document.querySelector('.distance-list')
    const rows = []
    for (const item of list.children) {
      const bounds = rect(item)
      const row = rows.find((row) => Math.abs(row[0].top - bounds.top) < 2)
      if (row) row.push(bounds)
      else rows.push([bounds])
      const value = item.querySelector('.distance-value')
      if (value.scrollWidth > value.clientWidth + 1) issues.push('distance text overflows')
    }
    const container = document.querySelector('.distance-container')
    const em = rect(container).width / parseFloat(getComputedStyle(container).fontSize)
    const expected = em >= 60 ? '5' : em >= 36 ? '3+2' : em >= 19 ? '2+2+1' : '1+1+1+1+1'
    const pattern = rows.map((row) => row.length).join('+')
    if (pattern !== expected) issues.push(`grid ${pattern}, expected ${expected}`)
    const bounds = rect(list)
    for (const row of rows) {
      if (Math.abs(row[0].left - bounds.left) > 2 || Math.abs(row.at(-1).right - bounds.right) > 2) issues.push('unfilled row')
    }
    const gap = parseFloat(getComputedStyle(list).columnGap)
    for (const row of rows) {
      for (let i = 1; i < row.length; i++) {
        if (Math.abs(row[i].left - row[i - 1].right - gap) > 2) issues.push('inconsistent card gaps')
        if (Math.abs(row[i].width - row[0].width) > 2) issues.push('unequal card widths')
      }
    }
    const heights = [...list.children].map((node) => rect(node).height)
    if (Math.max(...heights) - Math.min(...heights) > 2) issues.push('unequal distance heights')
    const footer = document.querySelector('.campaign-footer')
    const footerBox = rect(footer)
    if (Math.abs(footerBox.left) > 1 || Math.abs(footerBox.right - innerWidth) > 1) issues.push('footer is not full width')
    const footerItems = [...document.querySelector('.campaign-footer-inner').children]
    for (let i = 0; i < footerItems.length; i++) {
      for (let j = i + 1; j < footerItems.length; j++) {
        if (overlap(rect(footerItems[i]), rect(footerItems[j]))) issues.push('footer overlap')
      }
    }
    const hero = document.querySelector('.hero')
    const header = document.querySelector('.site-header')
    if (Math.abs(rect(header).top + scrollY) > 1) issues.push('header does not start at the top')
    if (Math.abs(rect(hero).top - rect(header).bottom) > 1) issues.push('gap above hero')
    const logo = document.querySelector('.brand-logo')
    if (overlap(rect(logo), rect(header.querySelector('.button')))) issues.push('header overlap')
    const media = rect(document.querySelector('.hero-media'))
    if (Math.abs(media.width / media.height - 1.5) > .02 || media.width > 801) issues.push('hero media ratio or cap')
    if (overlap(media, rect(document.querySelector('.hero-content')))) issues.push('hero columns overlap')
    const control = document.querySelector('.motion-control')
    if (control) {
      const box = rect(control)
      if (box.left < media.left || box.right > media.right || box.top < media.top || box.bottom > media.bottom) issues.push('pause outside media')
    }
    const reference = rect(document.querySelector('.header-inner'))
    for (const selector of ['.hero-layout', '.distance-container', '.campaign-footer-inner']) {
      // The boundary fixture deliberately narrows only the distance component.
      if (isolatedDistanceGrid && selector === '.distance-container') continue
      const box = rect(document.querySelector(selector))
      if (Math.abs(box.left - reference.left) > 1 || Math.abs(box.right - reference.right) > 1) issues.push('misaligned container')
    }
    if (overlap(rect(logo), rect(hero.querySelector('h1')))) issues.push('logo and heading overlap')
    if (Math.abs(rect(logo).width / rect(logo).height - 900 / 168) > .02) issues.push('logo distorted')
    for (const node of hero.querySelectorAll('h1, .hero-description, .hero-details, .registration, .motion-control')) {
      const box = rect(node)
      if (box.left < -1 || box.right > innerWidth + 1 || box.bottom > rect(hero).bottom + 1) issues.push(`clipped ${node.className || node.tagName}`)
    }
    for (const node of document.querySelectorAll('h1, h2, h3, .button, .practical-link')) {
      if (node.scrollWidth > node.clientWidth + 2) issues.push(`text overflow ${node.className || node.tagName}`)
    }
    return issues
  }, { isolatedDistanceGrid })
}

