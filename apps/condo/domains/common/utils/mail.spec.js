const { normalizeEmail, maskNormalizedEmail }  = require('./mail')


describe('normalizeMail()', () => {
    test('no data', () => {
        expect(normalizeEmail()).toBeUndefined()
        expect(normalizeEmail(null)).toBeUndefined()
    })

    test('empty trimmed data', () => {
        expect(normalizeEmail('')).toBeUndefined()
        expect(normalizeEmail('      ')).toBeUndefined()
        expect(normalizeEmail('\t\t\t   ')).toBeUndefined()
    })

    test('correct lowering data', () => {
        expect(normalizeEmail('asd@asd.asd')).toEqual('asd@asd.asd')
        expect(normalizeEmail('ASD@asd.asd')).toEqual('asd@asd.asd')
        expect(normalizeEmail('asd@asD.aSd')).toEqual('asd@asd.asd')
        expect(normalizeEmail('uBiIcAOnBoardINGoVVV2007@sber.doma')).toEqual('ubiicaonboardingovvv2007@sber.doma')
    } )

    test('multiple @  test', () => {
        expect(normalizeEmail('asd@asd@ads')).toBeUndefined()
    })

    test('domain replace test', () => {
        expect(normalizeEmail('asd@ya.ru')).toEqual('asd@yandex.ru')
        expect(normalizeEmail('asd@yandex.az')).toEqual('asd@yandex.ru')
        expect(normalizeEmail('asd@yahoo.co.uk')).toEqual('asd@yahoo.com')
    })

    test('domain no replace test', () => {
        expect(normalizeEmail('asd@unKNown.domain')).toEqual('asd@unknown.domain')
    })

    test('plus remove test', () => {
        expect(normalizeEmail('asd+something@asd.asd')).toEqual('asd@asd.asd')
        expect(normalizeEmail('+something@asd.asd')).toBeUndefined()
    })

    test('empty domain or user', () => {
        expect(normalizeEmail('@asd.asd')).toBeUndefined()
        expect(normalizeEmail('asdasd@')).toBeUndefined()
        expect(normalizeEmail('@')).toBeUndefined()
        expect(normalizeEmail('')).toBeUndefined()
    })

    test('google single dots remove', () => {
        expect(normalizeEmail('a.b.c@gmail.com')).toEqual('abc@gmail.com')
        expect(normalizeEmail('a..b@gmail.com')).toEqual('a..b@gmail.com')
        expect(normalizeEmail('a.b..c@gmail.com')).toEqual('ab..c@gmail.com')
    })

    test('correct trimming data', () => {
        expect(normalizeEmail('   \t\t  asd@asd.asd')).toEqual('asd@asd.asd')
        expect(normalizeEmail('asd@asd.asd   \t\t  ')).toEqual('asd@asd.asd')
        expect(normalizeEmail('   \t\t  asd@asd.asd   \t\t  ')).toEqual('asd@asd.asd')
    })

    test('complex testcase', () => {
        expect(normalizeEmail('\t    ASD@asD.asd\t\t\t   ')).toEqual('asd@asd.asd')
        expect(normalizeEmail('   \t   my.EmAil@googleMAIL.com   \t')).toEqual('myemail@gmail.com')
        expect((normalizeEmail('      asdasd@ya.ru \t'))).toEqual('asdasd@yandex.ru')
    })
})

describe('maskNormalizedEmail()', () => {
    const cases = [
        ['a@example.com', 'a***@example.com'],
        ['ab@example.com', 'ab***@example.com'],
        ['abc@example.com', 'ab***@example.com'],
        ['abcd@example.com', 'ab***@example.com'],
        ['abcde@example.com', 'ab***@example.com'],
        ['abcdef@example.com', 'ab***@example.com'],
        ['abcdefg@example.com', 'ab***@example.com'],
        ['qwerty123@yandex.ru', 'qw***@yandex.ru'],
    ]
    test.each(cases)('should work correctly (%p)', (input, output) => {
        expect(maskNormalizedEmail(input)).toBe(output)
    })
})
