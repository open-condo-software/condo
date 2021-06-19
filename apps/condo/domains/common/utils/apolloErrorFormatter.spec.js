const { safeFormatError } = require('./apolloErrorFormatter')

const { createError } = require('apollo-errors')
const { ApolloError } = require('apollo-server-errors')

const NestedError = createError('NestedError', {
    message: 'Nested errors occurred',
    options: {
        showPath: true,
    },
})

class MyApolloError extends ApolloError {
    constructor (message) {
        super(message, 'MY_ERROR_CODE')
        Object.defineProperty(this, 'name', { value: 'MyApolloError' })
    }
}

describe('safeFormatError', () => {
    test('safeFormatError(new Error)', () => {
        const result = safeFormatError(new Error('Hello'))
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
            'stack': expect.stringMatching(/^Error: Hello/),
        })
    })
    test('safeFormatError(new NestedError)', () => {
        const result = safeFormatError(new NestedError({ message: 'Hello' }))
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'NestedError',
            'stack': expect.stringMatching(/^NestedError: Hello/),
            'data': {},
            'internalData': {},
            'time_thrown': expect.stringMatching(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/),
        })
    })
    test('safeFormatError(new MyApolloError)', () => {
        const error = new MyApolloError('something wrong!')
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'something wrong!',
            'name': 'MyApolloError',
            'stack': expect.stringMatching(/^MyApolloError: something wrong/),
            'extensions': {
                'code': 'MY_ERROR_CODE',
            },
        })
    })
    test('safeFormatError(new MyApolloError) with extensions', () => {
        const error = new ApolloError('something happened!', 'CODE1', { foo: [1], bar: '22' })
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'something happened!',
            'name': 'Error',
            'stack': expect.stringMatching(/^Error: something happened/),
            'extensions': {
                code: 'CODE1',
                foo: [1],
                bar: '22',
            },
        })
    })
    test('safeFormatError(new NestedError) with data', () => {
        const result = safeFormatError(new NestedError({
            message: 'Hello',
            internalData: { foo: [1] },
            data: { bar: 'no' },
        }))
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'NestedError',
            'stack': expect.stringMatching(/^NestedError: Hello/),
            'data': { bar: 'no' },
            'internalData': { foo: [1] },
            'time_thrown': expect.stringMatching(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/),
        })
    })
    test('safeFormatError(new Error) errors = null', () => {
        const error = new Error('Hello')
        error.errors = null
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
            'stack': expect.stringMatching(/^Error: Hello/),
        })
    })
    test('safeFormatError(new Error) errors = {}', () => {
        const error = new Error('Hello')
        error.errors = {}
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
            'stack': expect.stringMatching(/^Error: Hello/),
        })
    })
    test('safeFormatError(new Error) errors = {"name": new Error}', () => {
        const error = new Error('Hello')
        error.errors = { 'field': new Error('World') }
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
            'stack': expect.stringMatching(/^Error: Hello/),
            'errors': [
                expect.objectContaining({
                    'message': 'World',
                    'name': 'Error',
                    'stack': expect.stringMatching(/^Error: World/),
                }),
            ],
        })
    })
    test('safeFormatError(new Error) errors = [ new Error ]', () => {
        const error = new Error('Hello')
        error.errors = [new Error('World')]
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
            'stack': expect.stringMatching(/^Error: Hello/),
            'errors': [
                expect.objectContaining({
                    'message': 'World',
                    'name': 'Error',
                    'stack': expect.stringMatching(/^Error: World/),
                }),
            ],
        })
    })
    test('safeFormatError(new NestedError) nested', () => {
        const result = safeFormatError(new NestedError({ message: 'Hello' }))
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'NestedError',
            'stack': expect.stringMatching(/^NestedError: Hello/),
            'data': {},
            'internalData': {},
            'time_thrown': expect.stringMatching(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/),
        })
    })
})
