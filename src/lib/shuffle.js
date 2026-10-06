function shuffled(values, random) {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function shuffleRound(ids, previousId, random = Math.random) {
  if (ids.length < 2) return ids.filter((id) => id !== previousId)
  const candidates = ids.filter((id) => id !== previousId)
  const first = candidates[Math.floor(random() * candidates.length)]
  return [first, ...shuffled(ids.filter((id) => id !== first), random)]
}

// Construct only after hydration. The prerendered image already counts as seen.
export function createRotation(ids, initialId, random = Math.random) {
  let available = [...ids]
  let last = initialId
  let queue = shuffled(ids.filter((id) => id !== initialId), random)
  return {
    peek() {
      if (!queue.length) queue = shuffleRound(available, last, random)
      return queue[0] ?? null
    },
    commit(id) {
      if (queue[0] !== id) throw new Error('Only the prepared image can be committed')
      queue.shift()
      last = id
    },
    exclude(id) {
      available = available.filter((item) => item !== id)
      queue = queue.filter((item) => item !== id)
    },
  }
}
