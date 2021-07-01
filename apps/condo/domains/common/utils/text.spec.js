const { normalizeText } = require('./text')

describe('normalizePhone()', () => {
    test('empty text', () => {
        expect(normalizeText('')).toBeUndefined()
    })

    test('normalized text', () => {
        expect(normalizeText('lorem ipsum')).toEqual('lorem ipsum')
    })

    test('start and end spaces', () => {
        expect(normalizeText('            lorem ipsum dolor           ')).toEqual('lorem ipsum dolor')
        expect(normalizeText('  lorem   \n       ipsum   \n    dolor')).toEqual('lorem\nipsum\ndolor')
    })

    test('several spaces between words', () => {
        expect(normalizeText('lorem        ipsum    dolor')).toEqual('lorem ipsum dolor')
    })

    test('several empty line', () => {
        expect(normalizeText('123\n\n\n\n123\n\n\n456'))
            .toEqual('123\n\n123\n\n456')

        expect(normalizeText('123\r\n\r\n\r\n\r\n123\r\n\r\n\r\n456'))
            .toEqual('123\r\n\r\n123\r\n\r\n456')
    })
})
