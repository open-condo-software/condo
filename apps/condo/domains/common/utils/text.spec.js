const { faker } = require('@faker-js/faker')

const { normalizeText } = require('./text')

describe('normalizeText()', () => {
    test('empty text', () => {
        expect(normalizeText('')).toEqual('')
    })

    test('not a text', () => {
        expect(normalizeText(null)).toBeUndefined()
        expect(normalizeText(undefined)).toBeUndefined()
        expect(normalizeText(123)).toBeUndefined()
        expect(normalizeText({})).toBeUndefined()
        expect(normalizeText(new Date())).toBeUndefined()
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
        expect(normalizeText('123\n\n\n\n123\n\n456'))
            .toEqual('123\n123\n456')
    })

    test('removes extra spaces around punctuations', () => {
        expect(normalizeText('123c .  sad ...')).toEqual('123c. sad...')
        expect(normalizeText('например ,мама мыла раму . срочно!!!')).toEqual('например, мама мыла раму. срочно!!!')
        expect(normalizeText('abc    ,  asd123 : 123 \n 321 .    test')).toEqual('abc, asd123: 123\n321. test')
    })

    test('not add spaces for data, time, decimals and list sub items', () => {
        expect(normalizeText('123,45')).toEqual('123,45')
        expect(normalizeText('123,   45')).toEqual('123, 45')
        expect(normalizeText('5:30 PM')).toEqual('5:30 PM')
        expect(normalizeText('List:     30 bananas,   20 apples')).toEqual('List: 30 bananas, 20 apples')
        expect(normalizeText('12.02.2022')).toEqual('12.02.2022')
        expect(normalizeText('This was described in paragraph 2.a of agreement')).toEqual('This was described in paragraph 2.a of agreement')
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

    test('ignore punctuation if it contained at email', () => {
        const email = faker.internet.email()

        expect(normalizeText(`Client ask to send a bill list to email ${email} `)).toEqual(`Client ask to send a bill list to email ${email}`)
        expect(normalizeText(`Client with email ${email} ask to send feedback.Please send him reply as fast as you can`)).toEqual(`Client with email ${email} ask to send feedback. Please send him reply as fast as you can`)
    })

    test('ignore punctuation if it contained at url', () => {
        const url = faker.internet.url()

        expect(normalizeText(`Client link ${url}. So what do you think.It ok?`)).toEqual(`Client link ${url}. So what do you think. It ok?`)
        expect(normalizeText(`Client send a link.Here it is - ${url}.`)).toEqual(`Client send a link. Here it is - ${url}.`)
    })
})
