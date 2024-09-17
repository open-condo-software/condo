const { createError } = require('apollo-errors')
const { ApolloError } = require('apollo-server-errors')
const { GraphQLError } = require('graphql')
const { Source, parse } = require('graphql/language')

const { safeFormatError } = require('./apolloErrorFormatter')
const { GQLError } = require('./errors')

const GQL_SOURCE_EXAMPLE = new Source(`
  {
    field
  }
`)
const GQL_AST_EXAMPLE = parse(GQL_SOURCE_EXAMPLE)
const GQL_FIELD_NODE_EXAMPLE = GQL_AST_EXAMPLE.definitions[0].selectionSet.selections[0]
const GQL_KEYSTONE_INTERNAL_DATA_EXAMPLE = {
    // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
    authedId: '2b657cb4-c4d1-4743-aa3b-aef527fe16e4',
    authedListKey: 'User',
    // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
    itemId: '55b21bb3-d4b4-45fe-917f-58614b69bbca',
}

const NestedError = createError('NestedError', {
    message: 'Nested errors occurred',
    options: {
        showPath: true,
    },
})

const AccessDeniedError = createError('AccessDeniedError', {
    message: 'You do not have access to this resource',
    options: { showPath: true },
})

class MyApolloError extends ApolloError {
    constructor (message) {
        super(message, 'MY_ERROR_CODE')
        Object.defineProperty(this, 'name', { value: 'MyApolloError' })
    }
}

function toGraphQLFormat (safeFormattedError) {
    const result = {
        name: safeFormattedError.name,
        message: safeFormattedError.message || 'no message',
        locations: safeFormattedError.locations || null,
        path: safeFormattedError.path || null,
        originalError: safeFormattedError.originalError || null,
        extensions: {
            code: safeFormattedError?.extensions?.code || 'INTERNAL_SERVER_ERROR',
            ...(safeFormattedError.extensions ? safeFormattedError.extensions : {}),
        },
    }
    delete result.extensions.exception
    return result
}

describe('safeFormatError hide=false', () => {
    test('safeFormatError(object)', () => {
        const result = safeFormatError({ message: 'Hello', name: 'No', stack: 'no stack' })
        expect(result).toEqual({
            'message': '{ message: \'Hello\', name: \'No\', stack: \'no stack\' }',
            'name': 'NonError',
            'stack': expect.stringMatching(/^NonError: { message: 'Hello', name: 'No', stack: 'no stack' }/),
        })
    })
    test('safeFormatError(string)', () => {
        const result = safeFormatError('developer mistake!')
        expect(result).toEqual({
            'message': '\'developer mistake!\'',
            'name': 'NonError',
            'stack': expect.stringMatching(/^NonError: 'developer mistake!'/),
        })
    })
    test('safeFormatError(new Error)', () => {
        const result = safeFormatError(new Error('Hello'))
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
            'stack': expect.stringMatching(/^Error: Hello/),
        })
    })
    test('safeFormatError(new Error) uid', () => {
        const error = new Error('Hello')
        error.uid = 'nfiqwjfqf'
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
            'stack': expect.stringMatching(/^Error: Hello/),
            'uid': 'nfiqwjfqf',
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
        const nodes = result?.nodes
        const source = result?.source
        const positions = result?.positions
        expect(result).toEqual({
            nodes, source, positions,
            'message': 'msg1',
            'name': 'GraphQLError',
            'stack': expect.stringMatching(/^GraphQLError: msg1/),
            'locations': [
                {
                    'column': 5,
                    'line': 3,
                },
            ],
            'extensions': {
                'messageForDeveloper': 'msg1\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
            },
        })
    })
    test('safeFormatError(new GraphQLError) with printable GQL_SOURCE_EXAMPLE case2', () => {
        const error = new GraphQLError('msg2', null, GQL_SOURCE_EXAMPLE, [9])
        const result = safeFormatError(error)
        const source = result?.source
        const positions = result?.positions
        expect(result).toEqual({
            source, positions,
            'message': 'msg2',
            'name': 'GraphQLError',
            'stack': expect.stringMatching(/^GraphQLError: msg2/),
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
    test('safeFormatError(new GraphQLError) based on keystone error', () => {
        const original = new Error('original')
        const error = new GraphQLError('msg5', null, null, null, null, original)
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'msg5',
            'name': 'GraphQLError',
            'stack': expect.stringMatching(/^Error: original/),
            'originalError': {
                'message': 'original',
                'name': 'Error',
                'stack': expect.stringMatching(/^Error: original/),
            },
        })
    })
    test('safeFormatError(new GraphQLError) with original error', () => {
        const original = new NestedError({ message: 'Hello', internalData: { foo: [2] }, data: { bar: '33' } })
        const error = new GraphQLError('msg4', null, null, null, null, original)
        const result = safeFormatError(error)
        expect(result).toEqual({
            'message': 'msg4',
            'name': 'NestedError',  // keystone specific
            'stack': expect.stringMatching(/^NestedError: Hello/),
            'originalError': {
                'message': 'Hello',
                'name': 'NestedError',
                'stack': expect.stringMatching(/^NestedError: Hello/),
                'internalData': { foo: [2] },
                'data': { bar: '33' },
                'time_thrown': expect.stringMatching(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/),
            },
        })
    })
    test('safeFormatError(null)', () => {
        expect(safeFormatError(null)).toMatchObject({
            'message': 'null',
            'name': 'NonError',
        })
    })
    test('safeFormatError(KeystoneAccessDeniedError)', () => {
        const data = { type: 'query', target: 'user' }
        const internalData = { ...GQL_KEYSTONE_INTERNAL_DATA_EXAMPLE }
        const original = new AccessDeniedError({ data, internalData })
        const error = new GraphQLError('GraphQLError1', [GQL_FIELD_NODE_EXAMPLE], GQL_SOURCE_EXAMPLE, null, ['field'], original, {})
        expect(safeFormatError(error)).toEqual({
            'locations': [{ column: 5, line: 3 }],
            'message': 'GraphQLError1',
            'path': ['field'],
            'name': 'AccessDeniedError',
            'stack': expect.stringMatching(/^AccessDeniedError: You do not have access to this resource/),
            'originalError': {
                'name': 'AccessDeniedError',
                'stack': expect.stringMatching(/^AccessDeniedError: You do not have access to this resource/),
                'message': 'You do not have access to this resource',
                'data': data,
                'internalData': internalData,
                'time_thrown': expect.stringMatching(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/),
            },
            'extensions': {
                'messageForDeveloper': 'GraphQLError1\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
            },
        })
    })
})

describe('safeFormatError hide=true', () => {
    test('safeFormatError(new Error)', () => {
        const result = safeFormatError(new Error('Hello'), true)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
        })
    })
    test('safeFormatError(new Error) uid', () => {
        const error = new Error('Hello')
        error.uid = 'nfiqwjfqf'
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
            'uid': 'nfiqwjfqf',
        })
    })
    test('safeFormatError(new NestedError)', () => {
        const result = safeFormatError(new NestedError({ message: 'Hello' }), true)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'NestedError',
            'data': {},
        })
    })
    test('safeFormatError(new MyApolloError)', () => {
        const error = new MyApolloError('something wrong!')
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'something wrong!',
            'name': 'MyApolloError',
            'extensions': {
                'code': 'MY_ERROR_CODE',
            },
        })
    })
    test('safeFormatError(new MyApolloError) with extensions', () => {
        const error = new ApolloError('something happened!', 'CODE1', { foo: [1], bar: '22' })
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'something happened!',
            'name': 'Error',
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
        }), true)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'NestedError',
            'data': { bar: 'no' },
        })
    })
    test('safeFormatError(new Error) errors = null', () => {
        const error = new Error('Hello')
        error.errors = null
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
        })
    })
    test('safeFormatError(new Error) errors = {}', () => {
        const error = new Error('Hello')
        error.errors = {}
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
        })
    })
    test('safeFormatError(new Error) errors = {"name": new Error}', () => {
        const error = new Error('Hello')
        error.errors = { 'field': new Error('World') }
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
        })
    })
    test('safeFormatError(new Error) errors = [ new Error ]', () => {
        const error = new Error('Hello')
        error.errors = [new Error('World')]
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'Error',
        })
    })
    test('safeFormatError(new NestedError) nested', () => {
        const result = safeFormatError(new NestedError({ message: 'Hello' }), true)
        expect(result).toEqual({
            'message': 'Hello',
            'name': 'NestedError',
            'data': {},
        })
    })
    test('safeFormatError(new GraphQLError) with printable GQL_SOURCE_EXAMPLE case1', () => {
        const error = new GraphQLError('msg1', [GQL_FIELD_NODE_EXAMPLE])
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'msg1',
            'name': 'GraphQLError',
            'locations': [
                {
                    'column': 5,
                    'line': 3,
                },
            ],
            'extensions': {
                'messageForDeveloper': 'msg1\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
            },
        })
    })
    test('safeFormatError(new GraphQLError) with printable GQL_SOURCE_EXAMPLE case2', () => {
        const error = new GraphQLError('msg2', null, GQL_SOURCE_EXAMPLE, [9])
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'msg2',
            'name': 'GraphQLError',
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
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'msg3',
            'name': 'GraphQLError',
            'path': [
                'path',
                3,
                'to',
                'field',
            ],
        })
    })
    test('safeFormatError(new GraphQLError) based on keystone error', () => {
        const original = new Error('original')
        const error = new GraphQLError('msg5', null, null, null, null, original)
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'msg5',
            'name': 'GraphQLError',
        })
    })
    test('safeFormatError(new GraphQLError) with original error', () => {
        const original = new NestedError({ message: 'Hello', internalData: { foo: [2] }, data: { bar: '33' } })
        const error = new GraphQLError('msg4', null, null, null, null, original)
        const result = safeFormatError(error, true)
        expect(result).toEqual({
            'message': 'msg4',
            'name': 'NestedError',
        })
    })
    test('safeFormatError(KeystoneAccessDeniedError)', () => {
        const data = { type: 'query', target: 'user' }
        const internalData = { ...GQL_KEYSTONE_INTERNAL_DATA_EXAMPLE }
        const original = new AccessDeniedError({ data, internalData })
        const error = new GraphQLError('GraphQLError1', [GQL_FIELD_NODE_EXAMPLE], GQL_SOURCE_EXAMPLE, null, ['field'], original, {})
        expect(safeFormatError(error, true)).toEqual({
            'locations': [{ column: 5, line: 3 }],
            'message': 'GraphQLError1',
            'path': ['field'],
            'name': 'AccessDeniedError',
            'extensions': {
                'messageForDeveloper': 'GraphQLError1\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
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
            'name': 'GraphQLError',
            'extensions': {
                'code': 'INTERNAL_SERVER_ERROR',
                'messageForDeveloper': 'msg\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
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
            'name': 'GraphQLError',
            'extensions': {
                'code': 'INTERNAL_SERVER_ERROR',
                'messageForDeveloper': 'msg\n\nGraphQL request:3:5\n2 |   {\n3 |     field\n  |     ^\n4 |   }',
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
            'originalError': null,
        })
    })
    test('toGraphQLFormat(GQLError) no hide', () => {
        const message1 = Date.now().toString()
        const message2 = 'GQL' + (Date.now() % 100).toString()
        const name1 = 'Name' + (Date.now() % 100).toString()
        const original = new GQLError({
            code: 'UNAUTHENTICATED',
            type: 'NOT_FOUND',
            message: message1,
            name: name1,
        })
        const error = new GraphQLError(message2, null, null, null, null, original, {})
        const result = toGraphQLFormat(safeFormatError(error))
        const uid = result?.originalError?.uid
        expect(result).toEqual({
            'name': name1,
            'message': message2,
            'extensions': {
                'code': 'UNAUTHENTICATED',
                'type': 'NOT_FOUND',
            },
            'locations': null,
            'path': null,
            'originalError': {
                uid,
                'name': name1,
                'message': message1,
                'stack': expect.stringMatching(new RegExp(`^${name1}: ${message1}`)),
                'extensions': {
                    code: 'UNAUTHENTICATED',
                    type: 'NOT_FOUND',
                },
            },
        })
    })
    test('toGraphQLFormat(GQLError) hide', () => {
        const message1 = Date.now().toString()
        const message2 = 'GQL' + (Date.now() % 100).toString()
        const name1 = 'Name' + (Date.now() % 100).toString()
        const original = new GQLError({
            code: 'UNAUTHENTICATED',
            type: 'NOT_FOUND',
            message: message1,
            name: name1,
        })
        const error = new GraphQLError(message2, null, null, null, null, original, {})
        const result = toGraphQLFormat(safeFormatError(error, true))
        expect(result).toEqual({
            'name': name1,
            'message': message2,
            'extensions': {
                'code': 'UNAUTHENTICATED',
                'type': 'NOT_FOUND',
            },
            'locations': null,
            'path': null,
            'originalError': null,
        })
    })
})
