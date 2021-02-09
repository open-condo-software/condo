import { fromExData, reValidateExData, toExData, validate } from './excel.utils'

test('toExData()', () => {
    expect(toExData([[1, 2], [3, 4], [5, 6]])).toEqual([[{ value: 1 }, { value: 2 }], [{ value: 3 }, { value: 4 }], [{ value: 5 }, { value: 6 }]])
})

test('toExData() with undefined', () => {
    expect(toExData([[1, 2], [3, 4], [5]])).toEqual([[{ value: 1 }, { value: 2 }], [{ value: 3 }, { value: 4 }], [{ value: 5 }, { value: undefined }]])
})

test('reValidateExData(email)', () => {
    const d = toExData([['email', 'points'], ['teSt@example.com', 4], ['Победа <pobeda@info.pobeda.aero>', 6]])

    reValidateExData(d, {}, { 0: 'email' })
    expect(d).toEqual([
        [
            {
                value: 'email',
                cleanedValue: undefined,
                formattedValue: undefined,
                status: 'error',
                message: '[no.email.sign]',
            },
            {
                value: 'points',
            },
        ],
        [
            {
                value: 'teSt@example.com',
                cleanedValue: 'test@example.com',
                formattedValue: 'teSt@example.com',
                status: 'ok',
                message: undefined,
            },
            {
                value: 4,
            },
        ],
        [
            {
                value: 'Победа <pobeda@info.pobeda.aero>',
                cleanedValue: 'pobeda@info.pobeda.aero',
                formattedValue: 'pobeda@info.pobeda.aero',
                status: 'warn',
                message: '[warn.email.format]',
            },
            {
                value: 6,
            },
        ],
    ])

    reValidateExData(d, { 0: 'email' }, {})
    expect(d).toEqual([
        [
            {
                value: 'email',
                cleanedValue: undefined,
                formattedValue: undefined,
                status: undefined,
                message: undefined,
            },
            {
                value: 'points',
            },
        ],
        [
            {
                value: 'teSt@example.com',
                cleanedValue: undefined,
                formattedValue: undefined,
                status: undefined,
                message: undefined,
            },
            {
                value: 4,
            },
        ],
        [
            {
                value: 'Победа <pobeda@info.pobeda.aero>',
                cleanedValue: undefined,
                formattedValue: undefined,
                status: undefined,
                message: undefined,
            },
            {
                value: 6,
            },
        ],
    ])

})

test('fromExData()', () => {
    const d = toExData([['email', 'points'], ['TESt@example.com', 4], ['teSt@example.com', 4], ['Победа <pobeda@info.pobeda.aero>', 6]])
    reValidateExData(d, {}, { 0: 'email' })
    {
        const res = fromExData(d, { 0: 'email' }, { uniqueBy: ['email'], randomKey: 'key' })
        expect(res).toEqual([
            expect.objectContaining({
                email: 'email',
            }),
            expect.objectContaining({
                email: 'test@example.com',
            }),
            expect.objectContaining({
                email: 'pobeda@info.pobeda.aero',
            }),
        ])
    }
    {
        const res = fromExData(d, { 0: 'email' })
        expect(res).toEqual([
            expect.objectContaining({
                email: 'email',
            }),
            expect.objectContaining({
                email: 'test@example.com',
            }),
            expect.objectContaining({
                email: 'test@example.com',
            }),
            expect.objectContaining({
                email: 'pobeda@info.pobeda.aero',
            }),
        ])
    }
})

test('VALIDATORS(name)', () => {
    expect(validate('name', 'Allerdyce, St. John').cleanedValue).toEqual('Allerdyce, St. John')
    expect(validate('name', 'Death\'s Head III').cleanedValue).toEqual('Death\'s Head III')
    expect(validate('name', 'Cap \'N Hawk').cleanedValue).toEqual('Cap \'N Hawk')
    expect(validate('name', 'Abdol, Ahmet').cleanedValue).toEqual('Abdol, Ahmet')
    expect(validate('name', 'Adam II').cleanedValue).toEqual('Adam II')
    expect(validate('name', 'Павел Иванов').cleanedValue).toEqual('Павел Иванов')
    expect(validate('name', ' Павел \u0020\n\tИванов').cleanedValue).toEqual('Павел Иванов')
    expect(validate('name', 'Павел22 Иванов').cleanedValue).toEqual('Павел22 Иванов')
    expect(validate('name', 'Кузенов-Мазенов Живикин - Клубникин').cleanedValue).toEqual('Кузенов-Мазенов Живикин-Клубникин')
    expect(validate('name', 'Мазп---а靷ễша-֊־᐀᠆‐-―⸗⸚〜〰 ゠︱ Ё︲﹘ ﹣－енов Живикин - Клубникин').cleanedValue).toEqual('Мазп-а靷ễша-Ё-енов Живикин-Клубникин')
    expect(validate('name', 'Ma sh Klu').cleanedValue).toEqual('Ma sh Klu')
    expect(validate('name', 'Strange ¨ª¬ ¯²³´·¸¹º¼½¾Hack Name').cleanedValue).toEqual('Strange ¨ª¬ ¯²³´·¸¹º¼½¾Hack Name')
    expect(validate('name', 'Death\'s Head I&II').cleanedValue).toEqual(undefined)
    expect(validate('name', '113').cleanedValue).toEqual(undefined)
    expect(validate('name', 'No').cleanedValue).toEqual(undefined)
    expect(validate('name', 'KD113').cleanedValue).toEqual(undefined)
    expect(validate('name', '113.2').cleanedValue).toEqual(undefined)
    expect(validate('name', '100 222 333').cleanedValue).toEqual(undefined)
    expect(validate('name', '100, 222, 333').cleanedValue).toEqual(undefined)
})

test('VALIDATORS(phone)', () => {
    expect(validate('phone', '587-753-7028').cleanedValue).toEqual('5877537028')
    expect(validate('phone', '(116) 239-1938').cleanedValue).toEqual('1162391938')
    expect(validate('phone', '1-878-758-7353').cleanedValue).toEqual('18787587353')
    expect(validate('phone', '343.578.4788').cleanedValue).toEqual('3435784788')
})
