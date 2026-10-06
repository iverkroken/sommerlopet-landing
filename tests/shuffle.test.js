import test from 'node:test'
import assert from 'node:assert/strict'
import { createRotation, shuffleRound } from '../src/lib/shuffle.js'

const ids = ['open', 'children', 'older', 'finish-1', 'finish-2', 'finish-3']
const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)

test('every round visits each photo once and never repeats at a boundary', () => {
  for (let seed = 0; seed < 100; seed++) {
    const sequence = createRotation(ids, ids[0], seeded(seed))
    const seen = [ids[0]]
    for (let i = 0; i < 599; i++) {
      const next = sequence.peek()
      assert.notEqual(next, seen.at(-1))
      sequence.commit(next)
      seen.push(next)
    }
    for (let i = 0; i < seen.length; i += 6) assert.deepEqual([...seen.slice(i, i + 6)].sort(), [...ids].sort())
  }
})

test('randomness varies order without mutating the input', () => {
  const before = [...ids]
  const orders = new Set(Array.from({ length: 30 }, (_, i) => shuffleRound(ids, ids[0], seeded(i)).join(',')))
  assert.ok(orders.size > 5)
  assert.deepEqual(ids, before)
})

test('peeking never consumes a queued image; pause and retries preserve order', () => {
  const sequence = createRotation(ids, ids[0], seeded(42))
  const next = sequence.peek()
  for (let i = 0; i < 20; i++) assert.equal(sequence.peek(), next)
  sequence.commit(next)
  assert.notEqual(sequence.peek(), next)
})

test('failed images are excluded and a lone working image does not rotate', () => {
  const sequence = createRotation(ids, ids[0], seeded(42))
  for (const id of ids.slice(1)) sequence.exclude(id)
  assert.equal(sequence.peek(), null)
  assert.equal(createRotation([], null).peek(), null)
  assert.equal(createRotation(['a'], 'a').peek(), null)
})
