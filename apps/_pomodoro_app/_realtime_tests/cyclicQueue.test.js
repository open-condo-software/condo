const CyclicQueue = require('../realtime/application/utils/cyclicQueue');

test('Cyclic queue works as a queue', () => {
    const x = new CyclicQueue([1,2,3])
    expect(x.current()).toBe(1)
    expect(x.pop()).toBe(1)
    expect(x.current()).toBe(2)
});

test('Cyclic queue cycling is working', () => {
    const x = new CyclicQueue([1,2,3])
    x.pop()
    x.pop()
    x.pop()
    expect(x.current()).toBe(1)
});

test('Cyclic queue cycling with peeking is working', () => {
    const x = new CyclicQueue([1,2,3])
    x.pop()
    x.pop()
    expect(x.current()).toBe(3)
    expect(x.peekNext()).toBe(1)
});
