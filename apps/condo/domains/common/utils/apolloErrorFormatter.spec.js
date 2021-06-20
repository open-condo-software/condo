const { createError } = require('apollo-errors')
const { ApolloError } = require('apollo-server-errors')
const { GraphQLError } = require('graphql')
const { Source, parse } = require('graphql/language')

const { safeFormatError, toGraphQLFormat } = require('./apolloErrorFormatter')

const GQL_SOURCE_EXAMPLE = new Source(`
  {
    field
  }
`)
const GQL_AST_EXAMPLE = parse(GQL_SOURCE_EXAMPLE)
const GQL_FIELD_NODE_EXAMPLE = GQL_AST_EXAMPLE.definitions[0].selectionSet.selections[0]

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
    test('safeFormatError(new GraphQLError) with printable GQL_SOURCE_EXAMPLE case1', () => {
        const error = new GraphQLError('msg1', [GQL_FIELD_NODE_EXAMPLE])
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'msg1',
            'name': 'GraphQLError',
            'stack': expect.stringMatching(/^GraphQLError: msg1/),
            'developerMessage': 'msg1\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
            'locations': [
                {
                    'column': 5,
                    'line': 3,
                },
            ],
        })
    })
    test('safeFormatError(new GraphQLError) with printable GQL_SOURCE_EXAMPLE case2', () => {
        const error = new GraphQLError('msg2', null, GQL_SOURCE_EXAMPLE, [9])
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'msg2',
            'name': 'GraphQLError',
            'stack': expect.stringMatching(/^GraphQLError: msg2/),
            'developerMessage': 'msg2\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
            'locations': [
                {
                    'column': 5,
                    'line': 3,
                },
            ],
        })
    })
    test('safeFormatError(new GraphQLError) with path', () => {
        const error = new GraphQLError('msg3', null, null, null, [
            'path',
            3,
            'to',
            'field',
        ])
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'msg3',
            'name': 'GraphQLError',
            'stack': expect.stringMatching(/^GraphQLError: msg3/),
            'path': [
                'path',
                3,
                'to',
                'field',
            ],
        })
    })
    test('safeFormatError(new GraphQLError) with original error', () => {
        const original = new Error('original')
        const error = new GraphQLError('msg4', null, null, null, null, original)
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'msg4',
            'name': 'GraphQLError',
            'stack': expect.stringMatching(/^Error: original/),
            'originalError': {
                'message': 'original',
                'name': 'Error',
                'stack': expect.stringMatching(/^Error: original/),
            },
        })
    })
})

describe('toGraphQLFormat', () => {
    test('toGraphQLFormat(GraphQLError) no hide', () => {
        const original = new Error('original')
        original.errors = [
            new ApolloError('something happened!', 'CODE1', { foo: [1], bar: '22' }),
            new NestedError({ message: 'Hello', internalData: { foo: [2] }, data: { bar: '33' } })]
        const error = new GraphQLError('msg', [GQL_FIELD_NODE_EXAMPLE], null, null, ['path', 'field'], original)
        const result = toGraphQLFormat(safeFormatError(error))
        expect(result).toEqual({
            'extensions': {
                'developerMessage': 'msg\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
                'name': 'GraphQLError',
                'originalError': {
                    'errors': [
                        {
                            'extensions': {
                                'bar': '22',
                                'code': 'CODE1',
                                'foo': [
                                    1,
                                ],
                            },
                            'message': 'something happened!',
                            'name': 'Error',
                            'stack': expect.stringMatching(/^Error: something happened!/),
                        },
                        {
                            'data': {
                                'bar': '33',
                            },
                            'internalData': {
                                'foo': [
                                    2,
                                ],
                            },
                            'message': 'Hello',
                            'name': 'NestedError',
                            'stack': expect.stringMatching(/^NestedError: Hello/),
                            'time_thrown': expect.stringMatching(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/),
                        },
                    ],
                    'message': 'original',
                    'name': 'Error',
                    'stack': expect.stringMatching(/^Error: original/),
                },
                'stack': expect.stringMatching(/^Error: original/),
            },
            'locations': [
                {
                    'column': 5,
                    'line': 3,
                },
            ],
            'message': 'msg',
            'path': [
                'path',
                'field',
            ],
        })
    })
    test('toGraphQLFormat(GraphQLError) hide', () => {
        const original = new Error('original')
        original.errors = [
            new ApolloError('something happened!', 'CODE1', { foo: [1], bar: '22' }),
            new NestedError({ message: 'Hello', internalData: { foo: [2] }, data: { bar: '33' } })]
        const error = new GraphQLError('msg', [GQL_FIELD_NODE_EXAMPLE], null, null, ['path', 'field'], original)
        const result = toGraphQLFormat(safeFormatError(error, true))
        expect(result).toEqual({
            'extensions': {
                'developerMessage': 'msg\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
            },
            'locations': [
                {
                    'column': 5,
                    'line': 3,
                },
            ],
            'message': 'msg',
            'path': [
                'path',
                'field',
            ],
        })
    })
})