// Geometry assertions catch the previous 3+1+1 / 4+1 composition bug even without overflow.
export async function layoutProblems(page) {
  return page.evaluate(() => {
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
    const heights = [...list.children].map((node) => rect(node).height)
    if (Math.max(...heights) - Math.min(...heights) > 2) issues.push('unequal distance heights')
    const header = document.querySelector('.header-inner')
    if (overlap(rect(header.children[0]), rect(header.children[1]))) issues.push('header overlap')
    const hero = document.querySelector('.hero')
    for (const node of hero.querySelectorAll('h1, .hero-description, .hero-details, .registration, .motion-control')) {
      const box = rect(node)
      if (box.left < -1 || box.right > innerWidth + 1 || box.bottom > rect(hero).bottom + 1) issues.push(`clipped ${node.className || node.tagName}`)
    }
    for (const node of document.querySelectorAll('h1, h2, h3, .brand, .button')) {
      if (node.scrollWidth > node.clientWidth + 2) issues.push(`text overflow ${node.className || node.tagName}`)
    }
    return issues
  })
}

