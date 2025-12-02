const z = require('zod')

const { hasValidJsonStructure } = require('./validation.utils')

describe('hasValidJsonStructure()', () => {
    describe('dv', () => {
        test('no dv', () => {
            const errors = []
            const fieldPath = 'meta'
            const addFieldValidationError = (err) => errors.push(err)
            const args = { resolvedData: { [fieldPath]: {} }, fieldPath, addFieldValidationError }
            const schema = z.object({})

            hasValidJsonStructure(args, true, 1, schema)

            expect(errors).toEqual([
                '[json:unknownDataVersion:meta] Unknown `dv` attr inside JSON Object',
            ])
        })
        test('wrong dv', () => {
            const errors = []
            const fieldPath = 'meta'
            const addFieldValidationError = (err) => errors.push(err)
            const args = { resolvedData: { [fieldPath]: { dv: 2 } }, fieldPath, addFieldValidationError }
            const schema = z.object({})

            hasValidJsonStructure(args, false, 1, schema)

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
                const schema = z.object({
                    name: z.string().optional(),
                })

                hasValidJsonStructure(args, false, 1, schema)

                expect(errors).toEqual([])
            })
            test('for empty value', () => {
                const errors = []
                const fieldPath = 'meta'
                const addFieldValidationError = (err) => errors.push(err)
                const args = { resolvedData: { [fieldPath]: { dv: 1, name: '' } }, fieldPath, addFieldValidationError }
                const schema = z.object({
                    name: z.string().optional(),
                })
                hasValidJsonStructure(args, false, 1, schema)

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
                const schema = z.object({
                    name: z.string().optional(),
                })
                hasValidJsonStructure(args, false, 1, schema)

                expect(errors).toEqual([
                    '[json:wrongDataVersionFormat:meta] Field \'name\': Invalid input: expected string, received number',
                ])
            })
            test('no schema = no fields validation', () => {
                const errors = []
                const fieldPath = 'meta'
                const addFieldValidationError = (err) => errors.push(err)
                const args = {
                    resolvedData: { [fieldPath]: { dv: 1, name: 3221 } },
                    fieldPath,
                    addFieldValidationError,
                }
                hasValidJsonStructure(args, false, 1)

                expect(errors).toEqual([])
            })
        })
    })
})
