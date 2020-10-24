/**
 * @jest-environment node
 */

const CyclicQueue = require('./cyclicQueue')

test('Cyclic queue should work as a queue', () => {
    const x = new CyclicQueue([1, 2, 3])
    expect(x.current()).toBe(1)
    expect(x.pop()).toBe(1)
    expect(x.current()).toBe(2)
})

test('Cyclic queue should allow to get current item', () => {
    const x = new CyclicQueue([1, 2, 3])
    x.pop()
    x.pop()
    expect(x.current()).toBe(3)
})

test('Cyclic queue should allow to get next item', () => {
    const x = new CyclicQueue([1, 2, 3])
    x.pop()
    x.pop()
    expect(x.peekNext()).toBe(1)
})

test('Cyclic queue should reset to master when emptied', () => {
    const x = new CyclicQueue([1, 2, 3])
    x.pop()
    x.pop()
    x.pop()
    expect(x.current()).toBe(1)
})
