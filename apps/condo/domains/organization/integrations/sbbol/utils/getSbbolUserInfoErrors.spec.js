const { getSbbolUserInfoErrors } = require('./getSbbolUserInfoErrors')

const DEFAULT_SEED = {
    sub: 'bed57d21ef9922d8b835a99ca6e22f321af3a6064ce',
    orgOktmo: '45000000000',
    orgKpp: '772201001',
    iss: 'sbi.sbbol.ru',
    inn: '8821072087',
    orgJuridicalAddress: 'тер Сколково инновационного центра, ул. Нобеля, дом 1, эт. 1, пом. 1',
    OrgName: 'ООО "ДОМА"',
    individualExecutiveAgency: 1,
    aud: '8338',
    orgOkpo: '42900099',
    orgLawFormShort: 'ООО',
    orgOgrn: '1226600119164',
    name: 'Иванов Алексей Иванович',
    userPosition: 'Директор',
    phone_number: '79068882233',
    orgLawForm: 'Общество с ограниченной ответственностью ',
    email: 'ivan@example.com',
}

describe('getSbbolUserInfoErrors', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    test('no userGuid', () => {
        const errors = getSbbolUserInfoErrors(DEFAULT_SEED)
        expect(errors).toEqual(['must have required property \'userGuid\''])
    })
    test('no HashOrgId', () => {
        const errors = getSbbolUserInfoErrors({
            ...DEFAULT_SEED,
            userGuid: '5a99ca6e22f321af3a',
        })
        expect(errors).toEqual(['must have required property \'HashOrgId\''])
    })
    test('all data', () => {
        const errors = getSbbolUserInfoErrors({
            ...DEFAULT_SEED,
            userGuid: '5a99ca6e22f321af3a',
            HashOrgId: 'awf2a99ca6e22faf3a',
        })
        expect(errors).toEqual([])
    })
    test('empty data', () => {
        const errors = getSbbolUserInfoErrors({})
        expect(errors).toEqual(['must have required property \'inn\''])
    })
    test('without data', () => {
        const errors = getSbbolUserInfoErrors()
        expect(errors).toEqual(['must be object'])
    })
    test('with data as string', () => {
        const errors = getSbbolUserInfoErrors('data')
        expect(errors).toEqual(['must be object'])
    })
})
