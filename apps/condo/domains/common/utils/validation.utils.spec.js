const {
    hasRequiredJsonObject,
    hasOptionalJsonObject,
} = require('./validation.utils')

describe('JSON object validators', () => {
    const makeArgs = (fieldPath, value, errors) => ({
        resolvedData: { [fieldPath]: value },
        fieldPath,
        addFieldValidationError: (err) => errors.push(err),
    })

    describe('hasRequiredJsonObject()', () => {
        test('should fail when field is missing and return error', () => {
            const errors = []
            const args = {
                resolvedData: {},
                fieldPath: 'meta',
                addFieldValidationError: (e) => errors.push(e),
            }

            const result = hasRequiredJsonObject(args)

            expect(result).toBe(false)
            expect(errors).toEqual([
                '[required:noValue:meta] Value is required',
            ])
        })

        test('should fail when value is not object and return error', () => {
            const errors = []
            const args = makeArgs('meta', 'string', errors)

            const result = hasRequiredJsonObject(args)

            expect(result).toBe(false)
            expect(errors).toEqual([
                '[json:expectObject:meta] Expect JSON Object',
            ])
        })

        test('should fail when dv is wrong and return error', () => {
            const errors = []
            const args = makeArgs('meta', { dv: 2 }, errors)

            const result = hasRequiredJsonObject(args)

            expect(result).toBe(false)
            expect(errors).toEqual([
                '[json:unknownDataVersion:meta] Unknown `dv` attr inside JSON Object',
            ])
        })

        test('should pass when object is valid and return true', () => {
            const errors = []
            const args = makeArgs('meta', { dv: 1, name: 'test' }, errors)

            const result = hasRequiredJsonObject(args)

            expect(result).toBe(true)
            expect(errors).toEqual([])
        })
    })

    describe('hasOptionalJsonObject()', () => {
        test('should pass when field is missing and return true', () => {
            const errors = []
            const args = {
                resolvedData: {},
                fieldPath: 'meta',
                addFieldValidationError: (e) => errors.push(e),
            }

            const result = hasOptionalJsonObject(args)

            expect(result).toBe(true)
            expect(errors).toEqual([])
        })

        test('should fail when value is not object and return error', () => {
            const errors = []
            const args = makeArgs('meta', 123, errors)

            const result = hasOptionalJsonObject(args)

            expect(result).toBe(false)
            expect(errors).toEqual([
                '[json:expectObject:meta] Expect JSON Object',
            ])
        })

        test('should fail when dv is wrong and return error', () => {
            const errors = []
            const args = makeArgs('meta', { dv: 3 }, errors)

            const result = hasOptionalJsonObject(args)

            expect(result).toBe(false)
            expect(errors).toEqual([
                '[json:unknownDataVersion:meta] Unknown `dv` attr inside JSON Object',
            ])
        })

        test('should pass when object is valid and return true', () => {
            const errors = []
            const args = makeArgs('meta', { dv: 1 }, errors)

            const result = hasOptionalJsonObject(args)

            expect(result).toBe(true)
            expect(errors).toEqual([])
        })

        test('should pass when object has extra fields and return true', () => {
            const errors = []
            const args = makeArgs('meta', { dv: 1, foo: 'bar' }, errors)

            const result = hasOptionalJsonObject(args)

            expect(result).toBe(true)
            expect(errors).toEqual([])
        })
    })
})