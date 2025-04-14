const { BILLING_ACCOUNT_OWNER_TYPE_COMPANY, BILLING_ACCOUNT_OWNER_TYPE_PERSON } = require('@condo/domains/billing/constants/constants')
const { isPerson, clearAccountNumber } = require('@condo/domains/billing/schema/resolvers/utils')

const OWNER_TYPES_BY_FULL_NAME = {
    [BILLING_ACCOUNT_OWNER_TYPE_COMPANY]: ['ООО Ромашка', 'ИП Тараканов И.А.', 'ОАО Буравчик\n'],
    [BILLING_ACCOUNT_OWNER_TYPE_PERSON]: ['Васильев И. А.', 'Васильев Иван Андреевич', 'Васильев И А', 'Васильев И А\n'],
}
describe('Billing account resolver', () => {

    describe('Clear account number', () => {
        const CLEAR_RESULTS = {
            '20-I-1': ['лс 20-I-1', 'л/с 20-I-1', '№ 20-I-1', 'л/с № 20-I-1', 'л/с № 20-I-1\t'],
        }
        describe('should correctly remove personal account service words', () => {
            for (const [resultAccountNumber, useCases] of Object.entries(CLEAR_RESULTS)) {
                useCases.forEach(useCase => {
                    test(`Result for "${useCase}" should be ${resultAccountNumber}`, () => {
                        expect(clearAccountNumber(useCase)).toEqual(resultAccountNumber)
                    })
                })
            }
        })
    })

    describe('Detect the ownerType of the billing account by fullName', () => {

        describe(`Correctly detects ${BILLING_ACCOUNT_OWNER_TYPE_COMPANY}`, () => {
            test.each(OWNER_TYPES_BY_FULL_NAME[BILLING_ACCOUNT_OWNER_TYPE_COMPANY])(
                `should detect "%s" as not ${BILLING_ACCOUNT_OWNER_TYPE_PERSON}`,
                (fullName) => {
                    expect(isPerson(fullName)).toBe(false)
                }
            )
        })

        test('Do not use global flag in regexp', () => {
            // In case we are using global regexp we need to set COMPANY_REGEXP.lastIndex = 0 each time or use new RegExp(COMPANY_REGEXP)
            expect(isPerson(OWNER_TYPES_BY_FULL_NAME[BILLING_ACCOUNT_OWNER_TYPE_COMPANY][0])).toBe(false)
            expect(isPerson(OWNER_TYPES_BY_FULL_NAME[BILLING_ACCOUNT_OWNER_TYPE_COMPANY][0])).toBe(false)
        })

        describe(`Correctly detects ${BILLING_ACCOUNT_OWNER_TYPE_PERSON}`, () => {
            test.each(OWNER_TYPES_BY_FULL_NAME[BILLING_ACCOUNT_OWNER_TYPE_PERSON])(
                `should detect "%s" as ${BILLING_ACCOUNT_OWNER_TYPE_PERSON}`,
                (fullName) => {
                    expect(isPerson(fullName)).toEqual(true)
                }
            )
        })

        describe('Not valid inputs', () => {
            test('empty input returns false', () => {
                expect(isPerson('')).toBe(false)
                expect(isPerson(null)).toBe(false)
                expect(isPerson(undefined)).toBe(false)
                expect(isPerson(123)).toBe(false)
            })
        })

        describe('No global state for COMPANY_REGEXP', () => {
            test('empty input returns false', () => {
                expect(isPerson('')).toBe(false)
                expect(isPerson(null)).toBe(false)
                expect(isPerson(undefined)).toBe(false)
                expect(isPerson(123)).toBe(false)
            })
        })
    })
})


