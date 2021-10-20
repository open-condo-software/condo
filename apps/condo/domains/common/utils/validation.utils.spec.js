const {
    hasValidJsonStructure,
    isInnValid,
    VALID_RU_INN_10,
    VALID_RU_INN_12,
    INVALID_RU_INN_10,
    INVALID_RU_INN_12,
    SOME_RANDOM_LETTERS,
} = require('./validation.utils')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')

describe('hasValidJsonStructure()', () => {
    describe('dv', () => {
        test('no dv', () => {
            const errors = []
            const fieldPath = 'meta'
            const addFieldValidationError = (err) => errors.push(err)
            const args = { resolvedData: { [fieldPath]: {} }, fieldPath, addFieldValidationError }

            hasValidJsonStructure(args, true, 1, {})

            expect(errors).toEqual([
                '[json:unknownDataVersion:meta] Unknown `dv` attr inside JSON Object',
            ])
        })
        test('wrong dv', () => {
            const errors = []
            const fieldPath = 'meta'
            const addFieldValidationError = (err) => errors.push(err)
            const args = { resolvedData: { [fieldPath]: { dv: 2 } }, fieldPath, addFieldValidationError }

            hasValidJsonStructure(args, false, 1, {})

            expect(errors).toEqual([
                '[json:unknownDataVersion:meta] Unknown `dv` attr inside JSON Object',
            ])
        })
    })

    describe('fieldConstrains', () => {
        describe('string type check', () => {
            test('for no value', () => {
                const errors = []
                const fieldPath = 'meta'
                const addFieldValidationError = (err) => errors.push(err)
                const args = { resolvedData: { [fieldPath]: { dv: 1 } }, fieldPath, addFieldValidationError }

                hasValidJsonStructure(args, false, 1, {
                    name: { type: 'string' },
                })

                expect(errors).toEqual([])
            })
            test('for empty value', () => {
                const errors = []
                const fieldPath = 'meta'
                const addFieldValidationError = (err) => errors.push(err)
                const args = { resolvedData: { [fieldPath]: { dv: 1, name: '' } }, fieldPath, addFieldValidationError }

                hasValidJsonStructure(args, false, 1, {
                    name: { type: 'string' },
                })

                expect(errors).toEqual([])
            })
            test('for number value', () => {
                const errors = []
                const fieldPath = 'meta'
                const addFieldValidationError = (err) => errors.push(err)
                const args = {
                    resolvedData: { [fieldPath]: { dv: 1, name: 3221 } },
                    fieldPath,
                    addFieldValidationError,
                }

                hasValidJsonStructure(args, false, 1, {
                    name: { type: 'string' },
                })

                expect(errors).toEqual([
                    '[json:wrongDataVersionFormat:meta] Field \'name\': Name must be of type string',
                ])
            })
        })
    })
})

describe('isInnValid()', () => {
    test('for valid 10 char RU INN ', () => {
        expect(isInnValid(VALID_RU_INN_10, RUSSIA_COUNTRY)).toBe(true)
    })
    test('for valid 12 char RU INN ', () => {
        // NOTE: we need INNs only for organizations, that is of 10 chars length.
        // So valid 12 char length person INN doesn`t suit
        expect(isInnValid(VALID_RU_INN_12, RUSSIA_COUNTRY)).toBe(false)
    })
    test('for invalid 10 digits as RU INN', () => {
        expect(isInnValid(INVALID_RU_INN_10, RUSSIA_COUNTRY)).toBe(false)
    })
    test('for invalid 12 digits as RU INN', () => {
        expect(isInnValid(INVALID_RU_INN_12, RUSSIA_COUNTRY)).toBe(false)
    })
    test('for invalid random letters as RU INN', () => {
        expect(isInnValid(SOME_RANDOM_LETTERS, RUSSIA_COUNTRY)).toBe(false)
    })
    test('for invalid random wrong length number as RU INN', () => {
        expect(isInnValid(Math.floor(999 + Math.random() * 1000000), RUSSIA_COUNTRY)).toBe(false)
    })
})