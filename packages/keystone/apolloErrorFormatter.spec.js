const { createError } = require('apollo-errors')
const { ApolloError } = require('apollo-server-errors')
const { GraphQLError } = require('graphql')
const { Source, parse } = require('graphql/language')

const loader = require('@open-condo/locales/loader')

const { safeFormatError } = require('./apolloErrorFormatter')
const { GQLError, GQLErrorCode, GQLInternalErrorTypes } = require('./errors')

jest.mock('@open-condo/locales/loader')
loader.getTranslations.mockReturnValue({
    'api.user.INVALID_PASSWORD_LENGTH': 'Password length must be between {min} and {max} characters',
})

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

const ValidationFailureError = createError('ValidationFailureError', {
    message: 'You attempted to perform an invalid mutation',
    options: { showPath: true },
})

class MyApolloError extends ApolloError {
    constructor (message) {
        super(message, 'MY_ERROR_CODE')
        Object.defineProperty(this, 'name', { value: 'MyApolloError' })
    }
}

class DatabaseError extends Error {
    name = 'error'
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
            'errId': error.uid,
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
            'fullstack': expect.stringMatching(/^Error: Hello(.*?)Caused By: Error: World(.*?)$/s),
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
            'data': { bar: '33' },  // backward compatibility, drop it
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
        expect(safeFormatError(null)).toEqual({
            'message': 'null',
            'name': 'NonError',
            'stack': expect.stringMatching(/^NonError: null/),
        })
    })
    test('safeFormatError(KeystoneAccessDeniedError)', () => {
        const data = { type: 'query', target: 'user' }
        const internalData = { ...GQL_KEYSTONE_INTERNAL_DATA_EXAMPLE }
        const original = new AccessDeniedError({ data, internalData })
        // NOTE(pahaz): in real world case the error will accept `original.message` as argument like so `new GraphQLError(original.message, ...)`
        //  but here we want to test that the result message taken from the GraphQLError.message and the original.message shown inside
        //  originalError field
        const error = new GraphQLError('GraphQLError1', [GQL_FIELD_NODE_EXAMPLE], GQL_SOURCE_EXAMPLE, null, ['field'], original, {})
        expect(safeFormatError(error)).toEqual({
            'locations': [{ column: 5, line: 3 }],
            'message': 'GraphQLError1',
            'path': ['field'],
            'name': 'AccessDeniedError',
            'stack': expect.stringMatching(/^AccessDeniedError: You do not have access to this resource/),
            'data': data,  // backward compatibility, drop it
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
    test('safeFormatError(GQLError)', () => {
        const message1 = Date.now().toString()
        const message2 = 'GQL' + (Date.now() % 100).toString()
        const original = new GQLError({
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
            message: message1,
        })
        const error = new GraphQLError(message2, null, null, null, null, original, {})
        const result = safeFormatError(error)
        const errId = result?.originalError?.errId
        expect(result).toEqual({
            'name': 'GQLError',
            'message': message2,
            'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
            'extensions': {
                code: GQLErrorCode.INTERNAL_ERROR,
                type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                'message': message1,
            },
            'originalError': {
                errId,
                'name': 'GQLError',
                'message': message1,
                'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
                'extensions': {
                    code: GQLErrorCode.INTERNAL_ERROR,
                    type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                    'message': message1,
                },
            },
        })
    })
    test('safeFormatError(GQLError) with messageInterpolation with existing keys', () => {
        const message1 = '{foo} and {bar}'
        const error = new GQLError({
            code: 'INTERNAL_ERROR',
            type: 'SOME_TYPE',
            message: message1,
            messageInterpolation: {
                foo: 'string',
                bar: 1,
            },
        })
        const errId = error.uid
        expect(safeFormatError(error)).toEqual({
            'name': 'GQLError',
            'message': 'string and 1',
            'stack': expect.stringMatching(new RegExp('^GQLError: string and 1')),
            errId,
            'extensions': {
                code: 'INTERNAL_ERROR',
                type: 'SOME_TYPE',
                'message': 'string and 1',
                messageInterpolation: {
                    foo: 'string',
                    bar: 1,
                },
            },
        })
    })
    test('safeFormatError(GQLError) with context', () => {
        const message1 = Date.now().toString()
        const message2 = 'GQL' + (Date.now() % 100).toString()
        const reqId = 'req' + (Date.now() % 500).toString()
        const original = new GQLError({
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
            message: message1,
        }, { req: { id: reqId }, name: 'context1' })
        const error = new GraphQLError(message2, null, null, null, null, original, {})
        const result = safeFormatError(error)
        const errId = result?.originalError?.errId
        expect(result).toEqual({
            'name': 'GQLError',
            'message': message2,
            'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
            'extensions': {
                code: GQLErrorCode.INTERNAL_ERROR,
                type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                'message': message1,
            },
            'originalError': {
                errId,
                reqId,
                'name': 'GQLError',
                'message': message1,
                'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
                'extensions': {
                    code: GQLErrorCode.INTERNAL_ERROR,
                    type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                    'message': message1,
                },
            },
        })
    })
    test('safeFormatError(GQLError) with context and wrong messageForUser', () => {
        const message1 = Date.now().toString()
        const message2 = 'GQL' + (Date.now() % 100).toString()
        const reqId = 'req' + (Date.now() % 500).toString()
        const original = new GQLError({
            code: 'INTERNAL_ERROR',
            type: 'WRONG_FORMAT',
            message: message1,
            messageForUser: 'api.UNKNOWN_KEY',
        }, { req: { id: reqId }, name: 'context1' })
        const error = new GraphQLError(message2, null, null, null, null, original, {})
        const result = safeFormatError(error)
        const errId = result?.originalError?.errId
        expect(result).toEqual({
            'name': 'GQLError',
            'message': message2,
            'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
            'extensions': {
                code: 'INTERNAL_ERROR',
                type: 'WRONG_FORMAT',
                'messageForUserTemplateKey': 'api.UNKNOWN_KEY',
                'message': message1,
            },
            'originalError': {
                errId,
                reqId,
                'name': 'GQLError',
                'message': message1,
                'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
                'extensions': {
                    code: 'INTERNAL_ERROR',
                    type: 'WRONG_FORMAT',
                    'messageForUserTemplateKey': 'api.UNKNOWN_KEY',
                    'message': message1,
                },
            },
        })
    })
    test('safeFormatError(GQLError) without context and wrong messageForUser', () => {
        const message1 = Date.now().toString()
        const message2 = 'GQL' + (Date.now() % 100).toString()
        const original = new GQLError({
            code: 'INTERNAL_ERROR',
            type: 'WRONG_FORMAT',
            message: message1,
            messageForUser: 'api.UNKNOWN_KEY',
        })
        const error = new GraphQLError(message2, null, null, null, null, original, {})
        const result = safeFormatError(error)
        const errId = result?.originalError?.errId
        expect(result).toEqual({
            'name': 'GQLError',
            'message': message2,
            'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
            'extensions': {
                code: 'INTERNAL_ERROR',
                type: 'WRONG_FORMAT',
                'messageForUserTemplateKey': 'api.UNKNOWN_KEY',
                'message': message1,
            },
            'originalError': {
                errId,
                'name': 'GQLError',
                'message': message1,
                'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
                'extensions': {
                    code: 'INTERNAL_ERROR',
                    type: 'WRONG_FORMAT',
                    'messageForUserTemplateKey': 'api.UNKNOWN_KEY',
                    'message': message1,
                },
            },
        })
    })
    test('safeFormatError(GQLError) with parentErrors = [new Error]', () => {
        const message1 = Date.now().toString()
        const message2 = 'GQL' + (Date.now() % 100).toString()
        const errors = [new Error('World')]
        const fields = {
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
        }
        const original = new GQLError({ ...fields, message: message1 }, null, errors)
        const error = new GraphQLError(message2, null, null, null, null, original, {})
        const result = safeFormatError(error)
        const errId = result?.originalError?.errId
        expect(result).toEqual({
            'name': 'GQLError',
            'message': message2,
            'fullstack': expect.stringMatching(new RegExp(`^GQLError: ${message1}(.*?)Caused By: Error: World`, 's')),
            'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
            'extensions': { ...fields, 'message': message1 },
            'originalError': {
                errId,
                'name': 'GQLError',
                'message': message1,
                'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
                'extensions': { ...fields, 'message': message1 },
                'errors': [
                    {
                        'message': 'World',
                        'name': 'Error',
                        'stack': expect.stringMatching(new RegExp('^Error: World')),
                    },
                ],
            },
        })
    })
    test('safeFormatError(GQLError) with parentErrors = [new GQLError]', () => {
        const message1 = Date.now().toString()
        const message2 = 'GQL' + (Date.now() % 100).toString()
        const message3 = 'ERR' + (Date.now() % 800).toString()
        const fields2 = {
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
        }
        const errors = [new GQLError({ ...fields2, message: message3 }, null, new Error('World'))]
        const fields1 = {
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
        }
        const original = new GQLError({ ...fields1, message: message1 }, null, errors)
        const error = new GraphQLError(message2, null, null, null, null, original, {})
        const result = safeFormatError(error)
        const topErrId = original.uid
        const nestedErrId = errors[0].uid
        expect(result).toEqual({
            'name': 'GQLError',
            'message': message2,
            'fullstack': expect.stringMatching(new RegExp(`^GQLError: ${message1}(.*?)Caused By: GQLError: ${message3}(.*?)Caused By: Error: World`, 's')),
            'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
            'extensions': { ...fields1, 'message': message3 },
            'originalError': {
                'name': 'GQLError',
                'message': message1,
                'stack': expect.stringMatching(new RegExp(`^GQLError: ${message1}`)),
                'extensions': { ...fields1, 'message': message1 },
                'errId': topErrId,
                'errors': [
                    {
                        'name': 'GQLError',
                        'message': message3,
                        'errId': nestedErrId,
                        'stack': expect.stringMatching(new RegExp(`^GQLError: ${message3}`)),
                        'extensions': { ...fields2, 'message': message3 },
                        'errors': [{
                            'message': 'World',
                            'name': 'Error',
                            'stack': expect.stringMatching(new RegExp('^Error: World')),
                        }],
                    },
                ],
            },
        })
    })
    test('safeFormatError(GQLError) with nested errors level 1', () => {
        const graphqlMessage = 'GQL' + (Date.now() % 100).toString()
        const gqlMessage = 'ERR' + (Date.now() % 800).toString()
        const gqlFields = {
            code: 'BAD_USER_INPUT',
            type: 'WRONG_FORMAT',
            message: gqlMessage,
        }
        const validation1 = new Error('KeystoneValidationLevel1')
        const gqlErr = new GQLError({ ...gqlFields }, null)
        const errId = gqlErr.uid
        validation1.errors = [gqlErr]
        const error = new GraphQLError(graphqlMessage, null, null, null, null, validation1, {})
        const result = safeFormatError(error)
        expect(result).toEqual({
            'name': 'GQLError',
            'message': graphqlMessage,
            'extensions': { ...gqlFields },
            'stack': expect.stringMatching(new RegExp('^Error: KeystoneValidationLevel1')),
            'fullstack': expect.stringMatching(new RegExp(`^Error: KeystoneValidationLevel1(.*?)Caused By: GQLError: ${gqlMessage}(.*?)`, 's')),
            'originalError': {
                'message': 'KeystoneValidationLevel1',
                'name': 'Error',
                'stack': expect.stringMatching(new RegExp('^Error: KeystoneValidationLevel1')),
                'errors': [
                    {
                        errId,
                        'extensions': { ...gqlFields },
                        message: gqlMessage,
                        name: 'GQLError',
                        'stack': expect.stringMatching(new RegExp(`^GQLError: ${gqlMessage}`)),
                    },
                ],
            },
        })
    })
    test('safeFormatError(GQLError) with nested errors level 2', () => {
        const graphqlMessage = 'GQL' + (Date.now() % 100).toString()
        const gqlF2Message = 'XXX' + (Date.now() % 900).toString()
        const gqlFields2 = {
            code: 'BAD_USER_INPUT',
            type: 'WRONG_FORMAT',
            message: gqlF2Message,
        }
        const gqlF1Message = 'ERR' + (Date.now() % 800).toString()
        const gqlFields1 = {
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
            message: gqlF1Message,
        }
        const validation2 = new Error('KeystoneValidationLevel2')
        const gql2 = new GQLError({ ...gqlFields2 }, null)
        validation2.errors = [gql2]
        const validation1 = new Error('KeystoneValidationLevel1')
        const gql1 = new GQLError({ ...gqlFields1 }, null, validation2)
        validation1.errors = [gql1]
        const error = new GraphQLError(graphqlMessage, null, null, null, null, validation1, {})
        const result = safeFormatError(error)
        expect(result).toEqual({
            'name': 'GQLError',
            'message': graphqlMessage,
            // NOTE(pahaz): only level 1 should be shown to user!
            'extensions': { ...gqlFields1 },
            'stack': expect.stringMatching(new RegExp('^Error: KeystoneValidationLevel1')),
            'fullstack': expect.stringMatching(new RegExp(`^Error: KeystoneValidationLevel1(.*?)Caused By: GQLError: ${gqlF1Message}(.*?)`, 's')),
            'originalError': {
                'message': 'KeystoneValidationLevel1',
                'name': 'Error',
                'stack': expect.stringMatching(new RegExp('^Error: KeystoneValidationLevel1')),
                'errors': [
                    {
                        'extensions': { ...gqlFields1 },
                        errId: gql1.uid,
                        'name': 'GQLError',
                        'message': gqlF1Message,
                        'stack': expect.stringMatching(new RegExp(`^GQLError: ${gqlF1Message}`)),
                        'errors': [
                            {
                                'errors': [
                                    {
                                        'extensions': { ...gqlFields2 },
                                        'message': gqlF2Message,
                                        'name': 'GQLError',
                                        'stack': expect.stringMatching(new RegExp(`^GQLError: ${gqlF2Message}`)),
                                        errId: gql2.uid,
                                    },
                                ],
                                'message': 'KeystoneValidationLevel2',
                                'name': 'Error',
                                'stack': expect.stringMatching(new RegExp('^Error: KeystoneValidationLevel2')),
                            },
                        ],
                    },
                ],
            },
        })
    })
    test('safeFormatError(GQLError) with nested wrapped errors', () => {
        const message1 = Date.now().toString()
        const message2 = 'GQL' + (Date.now() % 100).toString()
        const message3 = 'ERR' + (Date.now() % 800).toString()
        const message4 = 'XXX' + (Date.now() % 900).toString()
        const fields2 = {
            code: 'BAD_USER_INPUT',
            type: 'WRONG_FORMAT',
        }
        const fields1 = {
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
        }
        const original2 = new Error('InError')
        const gql2 = new GQLError({ ...fields1, message: message4 }, null)
        original2.errors = [gql2]
        const validation = new Error('KeystoneValidation')
        const originalGql = new GQLError({ ...fields2, message: message3 }, null, original2)
        validation.errors = [new GraphQLError(message1, null, null, null, null, originalGql, {})]
        const error = new GraphQLError(message2, null, null, null, null, validation, {})
        const result = safeFormatError(error)
        expect(result).toEqual({
            'name': 'GQLError',
            'message': message2,
            'extensions': { ...fields2, message: message3 },
            'stack': expect.stringMatching(new RegExp('^Error: KeystoneValidation')),
            'fullstack': expect.stringMatching(new RegExp(`^Error: KeystoneValidation(.*?)Caused By: GQLError: ${message3}(.*?)Caused By: Error: InError(.*?)Caused By: GQLError: ${message4}`, 's')),
            'originalError': {
                'message': 'KeystoneValidation',
                'name': 'Error',
                'stack': expect.stringMatching(new RegExp('^Error: KeystoneValidation')),
                'errors': [
                    {
                        'extensions': { ...fields2, 'message': message3 },
                        'name': 'GraphQLError',
                        'message': message1,
                        'stack': expect.stringMatching(new RegExp(`^GQLError: ${message3}`)),
                        'originalError': {
                            'errors': [
                                {
                                    'errors': [
                                        {
                                            'extensions': { ...fields1, 'message': message4 },
                                            errId: gql2.uid,
                                            'message': message4,
                                            'name': 'GQLError',
                                            'stack': expect.stringMatching(new RegExp(`^GQLError: ${message4}`)),
                                        },
                                    ],
                                    'message': 'InError',
                                    'name': 'Error',
                                    'stack': expect.stringMatching(new RegExp('^Error: InError')),
                                },
                            ],
                            'extensions': { ...fields2, message: message3 },
                            errId: originalGql.uid,
                            message: message3,
                            name: 'GQLError',
                            'stack': expect.stringMatching(new RegExp(`^GQLError: ${message3}`)),
                        },
                    },
                ],
            },
        })
    })
    test('safeFormatError(GQLError) change user password real case', () => {
        const internalErrorMessage = '[error] Update User internal error'
        const fields1 = {
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
        }
        const passwordLengthErrorMessage = 'Password length must be between 8 and 128 characters'
        const fields2 = {
            'variable': [
                'data',
                'password',
            ],
            'code': 'BAD_USER_INPUT',
            'type': 'INVALID_PASSWORD_LENGTH',
            'message': 'Password length must be between {min} and {max} characters',
            'messageForUser': 'api.user.INVALID_PASSWORD_LENGTH',
            'messageInterpolation': {
                'min': 8,
                'max': 128,
            },
        }
        const gqlError2 = new GQLError(fields2, {})
        const wrappedGQLError2 = new GraphQLError(passwordLengthErrorMessage, null, null, null, null, gqlError2, {})
        const gqlError1 = new GQLError({ ...fields1, message: internalErrorMessage }, {}, [wrappedGQLError2])
        const wrappedGQLError1 = new GraphQLError(internalErrorMessage, null, null, null, null, gqlError1, {})

        const result = safeFormatError(wrappedGQLError1)
        expect(result).toEqual({
            'name': 'GQLError',
            'message': '[error] Update User internal error',
            'extensions': {
                'code': 'BAD_USER_INPUT',
                'type': 'INVALID_PASSWORD_LENGTH',
                'messageForUser': 'Password length must be between 8 and 128 characters',
                'messageForUserTemplate': 'Password length must be between {min} and {max} characters',
                'messageForUserTemplateKey': 'api.user.INVALID_PASSWORD_LENGTH',
                'messageInterpolation': {
                    'max': 128,
                    'min': 8,
                },
                'message': 'Password length must be between 8 and 128 characters',
                'variable': [
                    'data',
                    'password',
                ],
            },
            'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Update User internal error(.*?)$', 's')),
            'fullstack': expect.stringMatching(new RegExp(`^GQLError: \\[error\\] Update User internal error(.*?)Caused By: GQLError: ${passwordLengthErrorMessage}(.*?)`, 's')),
            'originalError': {
                errId: gqlError1.uid,
                'errors': [
                    {
                        'extensions': {
                            'code': 'BAD_USER_INPUT',
                            'type': 'INVALID_PASSWORD_LENGTH',
                            'messageForUser': 'Password length must be between 8 and 128 characters',
                            'messageForUserTemplate': 'Password length must be between {min} and {max} characters',
                            'messageForUserTemplateKey': 'api.user.INVALID_PASSWORD_LENGTH',
                            'messageInterpolation': {
                                'max': 128,
                                'min': 8,
                            },
                            'message': passwordLengthErrorMessage,
                            'variable': [
                                'data',
                                'password',
                            ],
                        },
                        'message': passwordLengthErrorMessage,
                        'name': 'GraphQLError',
                        'originalError': {
                            errId: gqlError2.uid,
                            'extensions': {
                                'code': 'BAD_USER_INPUT',
                                'type': 'INVALID_PASSWORD_LENGTH',
                                'messageForUser': 'Password length must be between 8 and 128 characters',
                                'messageForUserTemplate': 'Password length must be between {min} and {max} characters',
                                'messageForUserTemplateKey': 'api.user.INVALID_PASSWORD_LENGTH',
                                'messageInterpolation': {
                                    'max': 128,
                                    'min': 8,
                                },
                                'message': 'Password length must be between 8 and 128 characters',
                                'variable': [
                                    'data',
                                    'password',
                                ],
                            },
                            'message': passwordLengthErrorMessage,
                            'name': 'GQLError',
                            'stack': expect.stringMatching(new RegExp(`^GQLError: ${passwordLengthErrorMessage}(.*?)`)),
                        },
                        'stack': expect.stringMatching(new RegExp(`^GQLError: ${passwordLengthErrorMessage}(.*?)`)),
                    },
                ],
                'name': 'GQLError',
                'message': '[error] Update User internal error',
                'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Update User internal error(.*?)')),
                'extensions': {
                    code: GQLErrorCode.INTERNAL_ERROR,
                    type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                    'message': '[error] Update User internal error',
                },
            },
        })
    })
    test('safeFormatError(GQLError(Error)) change user password keystone case', () => {
        const internalErrorMessage = '[error] Update User internal error'
        const fields1 = {
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
        }
        const passwordLengthErrorMessage = 'Password length must be between 8 and 128 characters'
        const fields2 = {
            'variable': [
                'data',
                'password',
            ],
            'code': 'BAD_USER_INPUT',
            'type': 'INVALID_PASSWORD_LENGTH',
            'message': 'Password length must be between {min} and {max} characters',
            'messageForUser': 'api.user.INVALID_PASSWORD_LENGTH',
            'messageInterpolation': {
                'min': 8,
                'max': 128,
            },
        }
        const gqlError2 = new GQLError(fields2, {})
        const keystoneError = new Error('keystone error')
        keystoneError.errors = [gqlError2]
        // const wrappedGQLError2 = new GraphQLError(passwordLengthErrorMessage, null, null, null, null, gqlError2, {})
        // keystoneError.errors = [wrappedGQLError2]
        const gqlError1 = new GQLError({ ...fields1, message: internalErrorMessage }, {}, [keystoneError])
        const wrappedGQLError1 = new GraphQLError(internalErrorMessage, null, null, null, null, gqlError1, {})

        const result = safeFormatError(wrappedGQLError1)
        expect(result).toEqual({
            'name': 'GQLError',
            'message': '[error] Update User internal error',
            'extensions': {
                'code': 'BAD_USER_INPUT',
                'type': 'INVALID_PASSWORD_LENGTH',
                'messageForUser': 'Password length must be between 8 and 128 characters',
                'messageForUserTemplate': 'Password length must be between {min} and {max} characters',
                'messageForUserTemplateKey': 'api.user.INVALID_PASSWORD_LENGTH',
                'messageInterpolation': {
                    'max': 128,
                    'min': 8,
                },
                'message': 'Password length must be between 8 and 128 characters',
                'variable': [
                    'data',
                    'password',
                ],
            },
            'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Update User internal error(.*?)$', 's')),
            'fullstack': expect.stringMatching(new RegExp(`^GQLError: \\[error\\] Update User internal error(.*?)Caused By: Error: keystone error(.*?)Caused By: GQLError: ${passwordLengthErrorMessage}(.*?)`, 's')),
            'originalError': {
                errId: gqlError1.uid,
                'errors': [
                    {
                        'errors': [
                            {

                                'extensions': {
                                    'code': 'BAD_USER_INPUT',
                                    'type': 'INVALID_PASSWORD_LENGTH',
                                    'messageForUser': 'Password length must be between 8 and 128 characters',
                                    'messageForUserTemplate': 'Password length must be between {min} and {max} characters',
                                    'messageForUserTemplateKey': 'api.user.INVALID_PASSWORD_LENGTH',
                                    'messageInterpolation': {
                                        'max': 128,
                                        'min': 8,
                                    },
                                    'message': passwordLengthErrorMessage,
                                    'variable': [
                                        'data',
                                        'password',
                                    ],
                                },
                                errId: gqlError2.uid,
                                'message': passwordLengthErrorMessage,
                                'name': 'GQLError',
                                'stack': expect.stringMatching(new RegExp(`^GQLError: ${passwordLengthErrorMessage}(.*?)`)),
                            },
                        ],
                        'message': 'keystone error',
                        'name': 'Error',
                        'stack': expect.stringMatching(new RegExp('^Error: keystone error')),
                    },
                ],
                'name': 'GQLError',
                'message': '[error] Update User internal error',
                'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Update User internal error(.*?)')),
                'extensions': {
                    code: GQLErrorCode.INTERNAL_ERROR,
                    type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                    'message': '[error] Update User internal error',
                },
            },
        })
    })
    test('safeFormatError(GQLError(Error)) change user password keystone with sub error case', () => {
        const internalErrorMessage = '[error] Update User internal error'
        const fields1 = {
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
        }
        const passwordLengthErrorMessage = 'Password length must be between 8 and 128 characters'
        const fields2 = {
            'variable': [
                'data',
                'password',
            ],
            'code': 'BAD_USER_INPUT',
            'type': 'INVALID_PASSWORD_LENGTH',
            'message': 'Password length must be between {min} and {max} characters',
            'messageForUser': 'api.user.INVALID_PASSWORD_LENGTH',
            'messageInterpolation': {
                'min': 8,
                'max': 128,
            },
        }
        const gqlError2 = new GQLError(fields2, {})
        const wrappedGQLError2 = new GraphQLError(passwordLengthErrorMessage, null, null, null, null, gqlError2, {})
        const keystoneError = new Error('keystone error')
        keystoneError.errors = [wrappedGQLError2]
        const gqlError1 = new GQLError({ ...fields1, message: internalErrorMessage }, {}, [keystoneError])
        const wrappedGQLError1 = new GraphQLError(internalErrorMessage, null, null, null, null, gqlError1, {})

        const result = safeFormatError(wrappedGQLError1)
        expect(result).toEqual({
            'name': 'GQLError',
            'message': '[error] Update User internal error',
            'extensions': {
                'code': 'BAD_USER_INPUT',
                'type': 'INVALID_PASSWORD_LENGTH',
                'messageForUser': 'Password length must be between 8 and 128 characters',
                'messageForUserTemplate': 'Password length must be between {min} and {max} characters',
                'messageForUserTemplateKey': 'api.user.INVALID_PASSWORD_LENGTH',
                'messageInterpolation': {
                    'max': 128,
                    'min': 8,
                },
                'message': 'Password length must be between 8 and 128 characters',
                'variable': [
                    'data',
                    'password',
                ],
            },
            'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Update User internal error(.*?)$', 's')),
            'fullstack': expect.stringMatching(new RegExp(`^GQLError: \\[error\\] Update User internal error(.*?)Caused By: Error: keystone error(.*?)Caused By: GQLError: ${passwordLengthErrorMessage}(.*?)`, 's')),
            'originalError': {
                errId: gqlError1.uid,
                'errors': [
                    {
                        'errors': [
                            {

                                'extensions': {
                                    'code': 'BAD_USER_INPUT',
                                    'type': 'INVALID_PASSWORD_LENGTH',
                                    'messageForUser': 'Password length must be between 8 and 128 characters',
                                    'messageForUserTemplate': 'Password length must be between {min} and {max} characters',
                                    'messageForUserTemplateKey': 'api.user.INVALID_PASSWORD_LENGTH',
                                    'messageInterpolation': {
                                        'max': 128,
                                        'min': 8,
                                    },
                                    'message': passwordLengthErrorMessage,
                                    'variable': [
                                        'data',
                                        'password',
                                    ],
                                },
                                'message': passwordLengthErrorMessage,
                                'name': 'GraphQLError',
                                'stack': expect.stringMatching(new RegExp(`^GQLError: ${passwordLengthErrorMessage}(.*?)`)),
                                'originalError': {
                                    errId: gqlError2.uid,
                                    'extensions': {
                                        'code': 'BAD_USER_INPUT',
                                        'message': 'Password length must be between 8 and 128 characters',
                                        'messageForUser': 'Password length must be between 8 and 128 characters',
                                        'messageForUserTemplate': 'Password length must be between {min} and {max} characters',
                                        'messageForUserTemplateKey': 'api.user.INVALID_PASSWORD_LENGTH',
                                        'messageInterpolation': {
                                            'max': 128,
                                            'min': 8,
                                        },
                                        'type': 'INVALID_PASSWORD_LENGTH',
                                        'variable': [
                                            'data',
                                            'password',
                                        ],
                                    },
                                    'message': 'Password length must be between 8 and 128 characters',
                                    'name': 'GQLError',
                                    'stack': expect.stringMatching(new RegExp(`^GQLError: ${passwordLengthErrorMessage}(.*?)`)),
                                },
                            },
                        ],
                        'message': 'keystone error',
                        'name': 'Error',
                        'stack': expect.stringMatching(new RegExp('^Error: keystone error')),
                    },
                ],
                'name': 'GQLError',
                'message': '[error] Update User internal error',
                'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Update User internal error(.*?)')),
                'extensions': {
                    code: GQLErrorCode.INTERNAL_ERROR,
                    type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                    'message': '[error] Update User internal error',
                },
            },
        })
    })
    test('safeFormatError(ValidationFailureError)', () => {
        const error = new ValidationFailureError({
            data: {
                messages: ['[app:noAppUrl] If the app is global, it must have appUrl field'],
                errors: [{}],
                listKey: 'B2BApp',
                operation: 'create',
            },
            internalData: {
                errors: [{}],
                data: {
                    'name': 'ONDRICKA-- ROGAHN B2B APP',
                    'developer': 'Russel Group',
                    'appUrl': null,
                    'isHidden': true,
                    'isGlobal': true,
                    'dv': 1,
                    'sender': {
                        'dv': 1,
                        'fingerprint': 'phqlacfs',
                    },
                },
            },
        })
        const graphQLError = new GraphQLError(error.message, null, null, null, null, error, {
            'code': 'INTERNAL_SERVER_ERROR',
        })
        expect(safeFormatError(graphQLError)).toEqual({
            'stack': expect.stringMatching(new RegExp(`^ValidationFailureError: ${error.message}(.*?)`, 's')),
            'message': 'You attempted to perform an invalid mutation',
            'name': 'ValidationFailureError',
            // NOTE(pahaz): check Address.test.js: `throw an error if try to override with empty object`
            //   we already support `data` field for ValidationFailureError and we should extract it at the top.
            //   We need to drop this mess in a future, but now it's backward compatibility
            // TODO(pahaz): DOMA-10348 drop this support
            'data': {
                'errors': [{}],
                'listKey': 'B2BApp',
                'messages': ['[app:noAppUrl] If the app is global, it must have appUrl field'],
                'operation': 'create',
            },
            'extensions': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': '[app:noAppUrl] If the app is global, it must have appUrl field',
            },
            'originalError': {
                'message': 'You attempted to perform an invalid mutation',
                'name': 'ValidationFailureError',
                'stack': expect.stringMatching(new RegExp(`^ValidationFailureError: ${error.message}(.*?)`, 's')),
                'data': {
                    'messages': [
                        '[app:noAppUrl] If the app is global, it must have appUrl field',
                    ],
                    'errors': [
                        {},
                    ],
                    'listKey': 'B2BApp',
                    'operation': 'create',
                },
                'time_thrown': expect.anything(),
                'internalData': {
                    'errors': [
                        {},
                    ],
                    'data': {
                        'name': 'ONDRICKA-- ROGAHN B2B APP',
                        'developer': 'Russel Group',
                        'appUrl': null,
                        'isHidden': true,
                        'isGlobal': true,
                        'dv': 1,
                        'sender': {
                            'dv': 1,
                            'fingerprint': 'phqlacfs',
                        },
                    },
                },
            },
        })
    })
    test('safeFormatError(GQLError(ValidationFailureError))', () => {
        const error = new ValidationFailureError({
            data: {
                messages: ['[app:noAppUrl] If the app is global, it must have appUrl field'],
                errors: [{}],
                listKey: 'B2BApp',
                operation: 'create',
            },
            internalData: {
                errors: [{}],
                data: {
                    'name': 'ONDRICKA-- ROGAHN B2B APP',
                    'developer': 'Russel Group',
                    'appUrl': null,
                    'isHidden': true,
                    'isGlobal': true,
                    'dv': 1,
                    'sender': {
                        'dv': 1,
                        'fingerprint': 'phqlacfs',
                    },
                },
            },
        })
        const gqlError = new GQLError({
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
            'message': '[error] Update B2BApp internal error',
        }, null, error)
        const graphQLError = new GraphQLError(gqlError.message, null, null, null, null, gqlError, {
            'code': 'INTERNAL_SERVER_ERROR',
        })
        const errId = gqlError.uid
        expect(safeFormatError(graphQLError)).toEqual({
            'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Update B2BApp internal error(.*?)', 's')),
            'fullstack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Update B2BApp internal error(.*?)Caused By: ValidationFailureError: You attempted to perform an invalid mutation', 's')),
            'message': '[error] Update B2BApp internal error',
            'name': 'GQLError',
            // NOTE(pahaz): check Address.test.js: `throw an error if try to override with empty object`
            //   we already support `data` field for ValidationFailureError and we should extract it at the top.
            //   We need to drop this mess in a future, but now it's backward compatibility
            // TODO(pahaz): DOMA-10348 drop this support
            'data': {
                'errors': [{}],
                'listKey': 'B2BApp',
                'messages': ['[app:noAppUrl] If the app is global, it must have appUrl field'],
                'operation': 'create',
            },
            'extensions': {
                code: GQLErrorCode.INTERNAL_ERROR,
                type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                'message': '[app:noAppUrl] If the app is global, it must have appUrl field',
            },
            'originalError': {
                'errors': [{
                    'message': 'You attempted to perform an invalid mutation',
                    'name': 'ValidationFailureError',
                    'stack': expect.stringMatching(new RegExp('^ValidationFailureError: You attempted to perform an invalid mutation(.*?)', 's')),
                    'data': {
                        'messages': [
                            '[app:noAppUrl] If the app is global, it must have appUrl field',
                        ],
                        'errors': [
                            {},
                        ],
                        'listKey': 'B2BApp',
                        'operation': 'create',
                    },
                    'time_thrown': expect.anything(),
                    'internalData': {
                        'errors': [
                            {},
                        ],
                        'data': {
                            'name': 'ONDRICKA-- ROGAHN B2B APP',
                            'developer': 'Russel Group',
                            'appUrl': null,
                            'isHidden': true,
                            'isGlobal': true,
                            'dv': 1,
                            'sender': {
                                'dv': 1,
                                'fingerprint': 'phqlacfs',
                            },
                        },
                    },
                }],
                'message': '[error] Update B2BApp internal error',
                'name': 'GQLError',
                errId,
                'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Update B2BApp internal error(.*?)', 's')),
                'extensions': {
                    code: GQLErrorCode.INTERNAL_ERROR,
                    type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                    'message': '[error] Update B2BApp internal error',
                },
            },
        })
    })
    test('safeFormatError(GQLError(GraphQLError(Error(Error(AccessDeniedError))))) RegisterMetersReadingsService case with fake MeterResource id', () => {
        // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
        const authedId = '5b1aab29-ab90-4c79-b6ea-0dadf0eab6eb'
        // throwAccessDenied
        const accessDenied = new AccessDeniedError({
            path: ['connect'],
            data: {
                'type': 'query',
                'target': 'MeterResource',
            },
            internalData: {
                'authedId': authedId,
                'authedListKey': 'User',
                'itemId': authedId,
            },
        })
        // resolveNestedSingle
        const internalError = new Error('Unable to connect a Meter.resource<MeterResource>')
        internalError.path = ['resource']
        internalError.errors = [accessDenied]
        // mapToFields
        const realError = new Error('Unable to connect a Meter.resource<MeterResource>')
        realError.errors = [internalError]
        // GQLError (Meter.create())
        const gqlParentError = new GraphQLError('Unable to connect a Meter.resource<MeterResource>', null, null, null, ['obj'], realError)
        const gqlError = new GQLError({
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
            'message': '[error] Create Meter internal error',
        }, null, gqlParentError)
        const graphQLError = new GraphQLError(gqlError.message, null, null, null, null, gqlError, {
            'code': 'INTERNAL_SERVER_ERROR',
        })
        const errId = gqlError.uid
        expect(safeFormatError(graphQLError)).toEqual({
            'name': 'GQLError',
            'message': '[error] Create Meter internal error',
            'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Create Meter internal error(.*?)', 's')),
            'fullstack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Create Meter internal error(.*?)Caused By: Error: Unable to connect a Meter.resource<MeterResource>(.*?)Caused By: Error: Unable to connect a Meter.resource<MeterResource>(.*?)Caused By: AccessDeniedError: You do not have access to this resource', 's')),
            'extensions': {
                code: GQLErrorCode.INTERNAL_ERROR,
                type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                'message': 'Unable to connect a Meter.resource<MeterResource>',
            },
            'originalError': {
                'name': 'GQLError',
                errId,
                'message': '[error] Create Meter internal error',
                'stack': expect.stringMatching(new RegExp('^GQLError: \\[error\\] Create Meter internal error(.*?)', 's')),
                'extensions': {
                    code: GQLErrorCode.INTERNAL_ERROR,
                    type: GQLInternalErrorTypes.SUB_GQL_ERROR,
                    'message': '[error] Create Meter internal error',
                },
                'errors': [
                    {
                        'message': 'Unable to connect a Meter.resource<MeterResource>',
                        'name': 'GraphQLError',
                        'originalError': {
                            'message': 'Unable to connect a Meter.resource<MeterResource>',
                            'name': 'Error',
                            'stack': expect.stringMatching(new RegExp('^Error: Unable to connect a Meter.resource(.*?)', 's')),
                            'errors': [{
                                'errors': [
                                    {
                                        'data': {
                                            'target': 'MeterResource',
                                            'type': 'query',
                                        },
                                        'internalData': {
                                            'authedId': authedId,
                                            'authedListKey': 'User',
                                            'itemId': authedId,
                                        },
                                        'message': 'You do not have access to this resource',
                                        'name': 'AccessDeniedError',
                                        'stack': expect.stringMatching(new RegExp('^AccessDeniedError: You do not have access to this resource(.*?)', 's')),
                                        'time_thrown': expect.stringMatching(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/),
                                    },
                                ],
                                'message': 'Unable to connect a Meter.resource<MeterResource>',
                                'name': 'Error',
                                'path': [
                                    'resource',
                                ],
                                'stack': expect.stringMatching(new RegExp('^Error: Unable to connect a Meter.resource(.*?)', 's')),
                            }],
                        },
                        'path': [
                            'obj',
                        ],
                        'stack': expect.stringMatching(new RegExp('^Error: Unable to connect a Meter.resource(.*?)', 's')),
                    },
                ],
            },
        })
    })
    test('safeFormatError(DatabaseError)', () => {
        const message = 'insert into "public"."Message" ("createdAt", "createdBy", "dv", "email", "id", "lang", "meta", "sender", "status", "type", "uniqKey", "updatedAt", "updatedBy", "user", "v") values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) returning * - duplicate key value violates unique constraint "message_unique_user_type_uniqKey"'
        const error = new DatabaseError(message)
        const graphQLError = new GraphQLError(error.message, null, null, null, null, error, {
            'code': 'INTERNAL_SERVER_ERROR',
        })
        expect(safeFormatError(graphQLError)).toEqual({
            'stack': expect.stringContaining(message),
            'message': message,
            'name': 'GraphQLError',
            'extensions': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': message,
            },
            'originalError': {
                'message': message,
                'name': 'error',
                'stack': expect.stringContaining(message),
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
            errId: error.uid,
            'message': 'Hello',
            'name': 'Error',
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
            data: { bar: '33' },
        })
    })
    test('safeFormatError(null)', () => {
        expect(safeFormatError(null, true)).toEqual({
            'message': 'null',
            'name': 'NonError',
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
            data,  // backward compatibility, drop it
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
        const sf = safeFormatError(error)
        const result = toGraphQLFormat(sf)
        const errId = result?.originalError?.errId
        expect(result).toEqual({
            'name': name1,
            'message': message2,
            'extensions': {
                'code': 'UNAUTHENTICATED',
                'type': 'NOT_FOUND',
                'message': message1,
            },
            'locations': null,
            'path': null,
            'originalError': {
                errId,
                'name': name1,
                'message': message1,
                'stack': expect.stringMatching(new RegExp(`^${name1}: ${message1}`)),
                'extensions': {
                    code: 'UNAUTHENTICATED',
                    type: 'NOT_FOUND',
                    'message': message1,
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
                'message': message1,
            },
            'locations': null,
            'path': null,
            'originalError': null,
        })
    })
})
