const { PushDeliveryError } = require('./PushDeliveryError')

describe('PushDeliveryError', () => {
    it.each([
        { name: 'undefined', original: undefined },
        { name: 'null', original: null },
    ])('uses a new Error when the original is $name', ({ original }) => {
        const error = new PushDeliveryError(original)
        const saved = error.toJSON()

        expect(error.originalError).toBeInstanceOf(Error)
        expect(saved).toEqual({ stack: expect.any(String) })
        expect(saved.stack.length).toBeLessThanOrEqual(100)
    })

    it('can be constructed without an error', () => {
        expect(() => new PushDeliveryError()).not.toThrow()
    })

    it.each([
        {
            name: 'all fields are undefined',
            fields: { code: undefined, message: undefined, stack: undefined },
            expected: {},
        },
        {
            name: 'all fields are null',
            fields: { code: null, message: null, stack: null },
            expected: {},
        },
        {
            name: 'all fields are empty strings',
            fields: { code: '', message: '', stack: '' },
            expected: {},
        },
        {
            name: 'only message is present',
            fields: { code: null, message: 'Failed', stack: '' },
            expected: { message: 'Failed' },
        },
        {
            name: 'only stack is present',
            fields: { code: '', message: '', stack: 'Original stack' },
            expected: { stack: 'Original stack' },
        },
        {
            name: 'only code is present',
            fields: { code: 'provider-failed', message: '', stack: null },
            expected: { code: 'provider-failed' },
        },
        {
            name: 'code is zero',
            fields: { code: 0, message: '', stack: '' },
            expected: { code: 0 },
        },
        {
            name: 'code is false',
            fields: { code: false, message: '', stack: '' },
            expected: { code: false },
        },
    ])('omits only empty fields when $name', ({ fields, expected }) => {
        const original = Object.assign(new Error(), fields)
        const error = new PushDeliveryError(original)

        expect(error.toJSON()).toEqual(expected)
        expect(JSON.parse(JSON.stringify({ error }))).toEqual({ error: expected })
    })

    it.each([99, 100, 101])('limits code, message and stack of length %s only when serializing', (length) => {
        const original = new Error('m'.repeat(length))
        original.stack = 's'.repeat(length)
        original.code = 'c'.repeat(length)

        const error = new PushDeliveryError(original)
        const saved = JSON.parse(JSON.stringify({ nested: [{ error }] })).nested[0].error

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe(original.message)
        expect(error.stack).toBe(original.stack)
        expect(error.code).toBe(original.code)
        expect(saved).toEqual({
            code: length > 100 ? `${'c'.repeat(97)}...` : original.code,
            message: length > 100 ? `${'m'.repeat(97)}...` : original.message,
            stack: length > 100 ? `${'s'.repeat(97)}...` : original.stack,
        })
        expect(original.message).toHaveLength(length)
        expect(original.stack).toHaveLength(length)
        expect(original.code).toHaveLength(length)
    })

    it.each([
        { name: 'a number', code: 404 },
        { name: 'a boolean', code: false },
        { name: 'a long array', code: Array(101).fill('value') },
        { name: 'an object with a length property', code: { length: 101 } },
    ])('leaves $name code unchanged in toJSON', ({ code }) => {
        const original = new Error('Provider failed')
        original.code = code

        const saved = new PushDeliveryError(original).toJSON()

        expect(saved.code).toBe(code)
    })

    it('keeps a short message intact when only stack needs truncation', () => {
        const original = new Error('Short message')
        original.stack = 's'.repeat(101)

        const saved = new PushDeliveryError(original).toJSON()

        expect(saved.message).toBe('Short message')
        expect(saved.stack).toHaveLength(100)
    })

    it('delegates serialization to the original toJSON with its own context and without truncation', () => {
        class CustomError extends Error {
            get code () {
                return 'custom-error-'.repeat(10)
            }

            toJSON () {
                return { providerCode: this.code, message: this.message, details: this.details }
            }
        }

        const original = new CustomError('Provider error details. '.repeat(10))
        original.stack = 'Original stack'
        original.details = { reason: 'Custom provider details' }
        const originalToJSON = jest.spyOn(original, 'toJSON')

        const error = new PushDeliveryError(original)
        const saved = JSON.parse(JSON.stringify({ error })).error

        expect(error.code).toBe(original.code)
        expect(saved).toEqual({ providerCode: original.code, message: original.message, details: original.details })
        expect(originalToJSON).toHaveBeenCalledTimes(1)
        expect(originalToJSON.mock.contexts[0]).toBe(original)
    })

    it.each([null, 'not a function'])('uses the fallback when original toJSON is %p', (toJSON) => {
        const original = new Error('Failed')
        original.stack = 'Original stack'
        original.toJSON = toJSON

        const saved = JSON.parse(JSON.stringify(new PushDeliveryError(original)))

        expect(saved).toEqual({ message: original.message, stack: original.stack })
    })

    it('does not invent a stack when the original error has none', () => {
        const original = new Error('Failed')
        delete original.stack

        const error = new PushDeliveryError(original)

        expect(error.stack).toBeUndefined()
        expect(JSON.parse(JSON.stringify(error))).toEqual({ message: 'Failed' })
    })

    it('retains the original error without exposing SDK internals in fallback JSON', () => {
        const original = new TypeError('m'.repeat(101))
        original.stack = 's'.repeat(101)
        original.request = { headers: { Authorization: 'secret' } }
        original.config = { apiKey: 'secret' }

        const error = new PushDeliveryError(original)

        expect(error.name).toBe('TypeError')
        expect(error.message).toBe(original.message)
        expect(error.stack).toBe(original.stack)
        expect(error.originalError).toBe(original)
        expect(error.request).toBeUndefined()
        expect(error.config).toBeUndefined()
        expect(JSON.stringify(error)).not.toContain('secret')
    })
})
