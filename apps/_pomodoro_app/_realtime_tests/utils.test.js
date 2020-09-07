/**
 * @jest-environment node
 */

const createRandomWord = require('../realtime/application/utils/createRandomWord')

test('Should generate random words', () => {
    const x = createRandomWord(5)
    const y = createRandomWord(5)
    expect(x).not.toBe(y)
})
