const { formatPushResultErrors } = require('./formatPushResultErrors')
const { PushDeliveryError } = require('./PushDeliveryError')

describe('formatPushResultErrors', () => {
    test('wraps native errors without changing the original result or counters', () => {
        const error = new Error('Failed')
        error.stack = 'Provider stack'
        const result = { error, responses: [{ error }], successCount: 0, failureCount: 1 }

        const formatted = formatPushResultErrors(result)
        const wrappedError = formatted.error

        expect(wrappedError).toBeInstanceOf(PushDeliveryError)
        expect(wrappedError).not.toBe(error)
        expect(wrappedError.message).toBe(error.message)
        expect(wrappedError.stack).toBe(error.stack)
        expect(formatted.responses[0].error).toBe(wrappedError)
        expect(formatted.successCount).toBe(0)
        expect(formatted.failureCount).toBe(1)
        expect(result.responses[0].error).toBe(error)
        expect(result.error).toBe(error)
    })

    test.each([
        { name: 'a string error', error: 'No pushTokens available.' },
        { name: 'a long string error', error: 'Provider error details. '.repeat(10) },
        { name: 'a plain provider error', error: { code: 404, status: 'NOT_FOUND', message: 'Token not found' } },
        { name: 'a plain error with a long message', error: { message: 'Provider error details. '.repeat(10) } },
        { name: 'null', error: null },
        { name: 'undefined', error: undefined },
    ])('leaves $name unchanged at both result and response levels', ({ error }) => {
        const result = { error, responses: [{ error }] }

        const formatted = formatPushResultErrors(result)

        expect(formatted.error).toBe(error)
        expect(formatted.responses[0].error).toBe(error)
    })

    test.each([
        { name: 'an empty result', result: {} },
        { name: 'an empty responses array', result: { responses: [] } },
        { name: 'a successful response', result: { responses: [{ success: true, messageId: 'sent' }] } },
    ])('leaves $name unchanged', ({ result }) => {
        const formatted = formatPushResultErrors(result)

        expect(formatted).toEqual(result)
    })

    test('wraps a shared error once and preserves response metadata', () => {
        const error = new Error('Provider failed')
        error.stack = 'Provider stack frame\n'.repeat(10)
        const result = { responses: [{ error, pushToken: 'test-token', appId: 'test-app' }, { error }] }

        const formatted = formatPushResultErrors(result)

        expect(formatted.responses[0].error).toBe(formatted.responses[1].error)
        expect(formatted.responses[0].pushToken).toBe('test-token')
        expect(formatted.responses[0].appId).toBe('test-app')
    })

    test('never wraps an existing PushDeliveryError again, including repeated processing', () => {
        const error = new PushDeliveryError(new Error('Provider failed'))
        const result = { error, responses: [{ error }] }

        const formatted = formatPushResultErrors(result)
        const formattedAgain = formatPushResultErrors(formatted)

        expect(formatted.error).toBe(error)
        expect(formatted.responses[0].error).toBe(error)
        expect(formattedAgain.error).toBe(error)
        expect(formattedAgain.responses[0].error).toBe(error)
    })
})
