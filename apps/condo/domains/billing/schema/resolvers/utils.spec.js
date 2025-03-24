const { isPerson } = require('./utils')

const PERSON_CASES = {
    VALID: [
        'Иванов Иван В.',
        'Петров Алексей',
        'Васильев И И',
        'В В В',
        'Петров Алексей' + '\n',
        'Петров Алексей      ',
    ],
    NOT_VALID: [
        'ООО Ромашка',
        'Безответственный пользователь',
        'ИП Васильев И И',
    ],
}

describe('Detect if the given string is person full name', () => {
    for (const checkCase of PERSON_CASES.VALID) {
        const result = isPerson(checkCase)
        test(`${checkCase} to be true`, () => {
            console.error(checkCase, result)
            expect(result).toBeTruthy()
        })
    }
    for (const checkCase of PERSON_CASES.NOT_VALID) {
        const result = isPerson(checkCase)
        test(`${checkCase} to be false`, () => {
            console.error(checkCase, result)
            expect(result).toBeFalsy()
        })
    }
})
