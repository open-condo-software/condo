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
    test('no userGuid and no sub', () => {
        const { sub, ...info } = {
            ...DEFAULT_SEED,
            HashOrgId: 'awf2a99ca6e22faf3a',
        }
        const errors = getSbbolUserInfoErrors({ ...info, HashOrgId: 'awf2a99ca6e22faf3a' })
        expect(errors).toEqual([
            'must have required property \'sub\'',
            'must have required property \'userGuid\'',
            'must match a schema in anyOf',
        ])
    })
    test('no userGuid but has sub', () => {
        const info = {
            ...DEFAULT_SEED,
            HashOrgId: 'awf2a99ca6e22faf3a',
        }
        const errors = getSbbolUserInfoErrors(info)
        expect(errors).toHaveLength(0)
    })
    test('no sub but has userGuid', () => {
        const { sub, ...info } = {
            ...DEFAULT_SEED,
            userGuid: '5a99ca6e22f321af3a',
            HashOrgId: 'awf2a99ca6e22faf3a',
        }
        const errors = getSbbolUserInfoErrors(info)
        expect(errors).toHaveLength(0)
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
        expect(errors).not.toHaveLength(0)
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
