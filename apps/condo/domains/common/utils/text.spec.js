const { normalizeText } = require('./text')

describe('normalizeText()', () => {
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

    test('normalize punctuations', () => {
        expect(normalizeText('123c .  sad ...')).toEqual('123c. sad...')
        expect(normalizeText('например ,мама мыла раму . срочно!!!')).toEqual('например, мама мыла раму. срочно!!!')
        expect(normalizeText('abc    ,  asd123 :123 \n 321 .    test')).toEqual('abc, asd123: 123\n321. test')
    })

    test('normalize quotes', () => {
        expect(normalizeText('"   123 312 432 " asd. ""')).toEqual('"123 312 432" asd. ""')
        expect(normalizeText('"   123      "      asd .     ""')).toEqual('"123" asd. ""')
        expect(normalizeText('"132   " " 13212asd  " zxc 123 "')).toEqual('"132" "13212asd" zxc 123 "')
    })

})
