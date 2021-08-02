const { normalizeText } = require('./text')

describe('normalizeText()', () => {
    test('empty text', () => {
        expect(normalizeText('')).toBeUndefined()
    })

    test('returns normalized text as is', () => {
        expect(normalizeText('lorem ipsum')).toEqual('lorem ipsum')
        expect(normalizeText('lorem   ipsum')).toEqual('lorem ipsum')
        expect(normalizeText('@#$%^&*()_+=-;.,:№"\\|{}[]?/<>~±§')).toEqual('@#$%^&*()_+=-;.,:№"\\|{}[]?/<>~±§')
    })

    test('removes leading and trailing spaces', () => {
        expect(normalizeText('            lorem ipsum dolor           ')).toEqual('lorem ipsum dolor')
        expect(normalizeText('  lorem   \n       ipsum   \n    dolor')).toEqual('lorem\nipsum\ndolor')
    })

    test('squashes sequential spaces into one', () => {
        expect(normalizeText('lorem        ipsum    dolor')).toEqual('lorem ipsum dolor')
        expect(normalizeText('lorem  \t  \r    ipsum    dolor')).toEqual('lorem ipsum dolor')
    })

    test('squashes sequential non-breaking spaces into one', () => {
        expect(normalizeText('lorem   ipsum dolor')).toEqual('lorem ipsum dolor')
    })

    test('squashes sequential blank lines into one', () => {
        expect(normalizeText('123\n\n\n\n123\n\n456')).toEqual('123\n123\n456')
    })

    test('removes extra spaces around punctuations', () => {
        expect(normalizeText('123c .  sad ...')).toEqual('123c. sad...')
        expect(normalizeText('например ,мама мыла раму . срочно!!!')).toEqual('например, мама мыла раму. срочно!!!')
        expect(normalizeText('abc    ,  asd123 :123 \n 321 .    test')).toEqual('abc, asd123: 123\n321. test')
    })

    test('removes trailing and leading spaces inside quotes', () => {
        expect(normalizeText('"   123 312 432 " asd. ""')).toEqual('"123 312 432" asd. ""')
        expect(normalizeText('"   123      "      asd .     ""')).toEqual('"123" asd. ""')
        expect(normalizeText('"132   " " 13212asd  " zxc 123 "')).toEqual('"132" "13212asd" zxc 123 "')
        expect(normalizeText('«   123  432   »')).toEqual('«123 432»')
        expect(normalizeText('“ 123    432   ”')).toEqual('“123 432”')
    })

    test('removes trailing and leading spaces inside nested quotes', () => {
        expect(normalizeText('“ 123  «   123  432   »  432   ”')).toEqual('“123 «123 432» 432”')
        expect(normalizeText('« 123  «   123  432   »  432   »')).toEqual('«123 «123 432» 432»')
        expect(normalizeText('“ 123 432 “  432 234   ” ”')).toEqual('“123 432 “432 234””')
    })
})
