const { isFunction, get, isEmpty } = require('lodash')
const falsey = require('falsey')

const EXTRA_LOGGING = falsey(get(process, 'env.DISABLE_LOGGING'))

/**
 * Implements correct expecting of GraphQLError, thrown by Keystone.
 * Expectation checks inside of `catch` are not covering a case,
 * when no exception is thrown, — test will pass, but should fail.
 * https://stackoverflow.com/questions/48707111/asserting-against-thrown-error-objects-in-jest
 *
 * @example
 * await catchErrorFrom(async () => {
 *     await doSomethingThatShouldThrowAnError()
 * }, (e) => {
 *     // any `expect` checks for catched error
 * })
 *
 *
 * @param {() => Promise<*>} testFunc - Function, expected to throw an error
 * @param {(Error) => void} inspect - Function, that should inspect the error in details
 * @return {Promise<*>}
 */
const catchErrorFrom = async (testFunc, inspect) => {
    if (testFunc.constructor.name !== 'AsyncFunction') throw new Error('catchErrorFrom( testFunc ) testFunc is not an AsyncFunction!')
    if (!isFunction(inspect)) throw new Error('catchErrorFrom( inspect ) inspect is not a function!')
    let thrownError = null
    try {
        await testFunc()
    } catch (e) {
        if (EXTRA_LOGGING) console.warn('catchErrorFrom() caught error:', e)
        thrownError = e
    }
    if (!thrownError) throw new Error(`catchErrorFrom() no caught error for: ${testFunc}`)
    return inspect(thrownError)
}

/**
 * Expects a GraphQLError of type 'AccessDeniedError', thrown by Keystone on access to a specified path.
 * Should be used to examine access to operation of GraphQL utility wrapper for complex paths.
 * If path is skipped, than nor it, neither value won't be checked. This option is useful,
 * when we have unstable errors contents, for example when there are sub-requests that are executed in parallel
 * and we get different errors, depending on which sub-request finishes first.
 * @example
 *
 * test('something, that should throw an error', async () => {
 *     const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
 *     await expectToThrowAccessDeniedError(async () => {
 *         await createTestResident(userClient, ...)
 *     }, [ 'objs', 0, 'organization' ])
 * })
 *
 * @param {TestFunc} testFunc - Function, expected to throw an error
 * @return {Promise<void>}
 */
const expectToThrowAccessDeniedError = async (testFunc, path) => {
    await catchErrorFrom(testFunc, ({ errors, data }) => {
        const expectedError = {
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
        }

        if (path) {
            expect(Array.isArray(path)).toBeTruthy()
            expect(isEmpty(path)).toBeFalsy()
            expectedError.path = path
        }

        expect(errors[0]).toMatchObject(expectedError)

        if (path) expect(get(data, path)).toBeNull()
    })
}

/**
 * Expects a GraphQLError of type 'AccessDeniedError', thrown by Keystone on access to a single schema object.
 * Should be used to examine access to operation of GraphQL utility wrapper, that returns `obj`.
 * @example
 *
 * test('something, that should throw an error', async () => {
 *     const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
 *     await expectToThrowAccessDeniedErrorToObj(async () => {
 *         await createTestOrganization(userClient)
 *     })
 * })
 *
 * @param {TestFunc} testFunc - Function, expected to throw an error
 * @return {Promise<void>}
 */
const expectToThrowAccessDeniedErrorToObj = async (testFunc) => {
    await catchErrorFrom(testFunc, ({ errors, data }) => {
        expect(errors[0]).toMatchObject({
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['obj'],
        })
        expect(data).toEqual({ 'obj': null })
    })
}

/**
 * Expects a GraphQLError of type 'AccessDeniedError', thrown by Keystone on access to a collection of schema objects.
 * Should be used to examine access to `getAll` GraphQL utility wrapper, that returns `objs`.
 * @example
 *
 * test('something, that should throw an error', async () => {
 *     const client = await makeClient()
 *     await expectToThrowAccessDeniedErrorToObj(async () => {
 *         await Organization.getAll(client)
 *     })
 * })
 *
 * @param {TestFunc} testFunc - Function, expected to throw an error
 * @return {Promise<void>}
 */
const expectToThrowAccessDeniedErrorToObjects = async (testFunc) => {
    await catchErrorFrom(testFunc, ({ errors, data }) => {
        expect(errors[0]).toMatchObject({
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
        expect(data).toEqual({ 'objs': null })
    })
}

/**
 * Expects a GraphQLError of type 'AccessDeniedError', thrown by Keystone on trying to execute a mutation,
 * which by convention returns `result` object.
 * Should be used to examine access to GraphQL mutations, that returns `result`.
 * @example
 *
 * test('something, that should throw an error', async () => {
 *     const client = await makeClient()
 *     await expectToThrowAccessDeniedErrorToResult(async () => {
 *         await registerResidentByTestClient(client)
 *     })
 * })
 *
 * @param {TestFunc} testFunc - Function, expected to throw an error
 * @return {Promise<void>}
 */
const expectToThrowAccessDeniedErrorToResult = async (testFunc) => {
    const path = 'result'
    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: [expect.objectContaining({
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': [path],
                'extensions': {
                    'code': 'INTERNAL_SERVER_ERROR',
                },
            })],
        })
    })
}

/**
 * Expects a GraphQL 'AuthenticationError' Error, thrown by access check if case of UNAUTHENTICATED user access.
 * Should be used to examine access to `getAll` GraphQL utility wrapper, that returns `objs`.
 * @example
 *
 * test('something, that should throw an error', async () => {
 *     const client = await makeClient()
 *     await expectToThrowAuthenticationErrorToObjects(async () => {
 *         await Organization.getAll(client)
 *     })
 * })
 *
 * @param {TestFunc} testFunc - Function, expected to throw an error
 * @return {Promise<void>}
 */
const expectToThrowAuthenticationError = async (testFunc, path) => {
    if (!path) throw new Error('expectToThrowAccessDeniedError(): no path argument')
    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: [expect.objectContaining({
                'message': 'No or incorrect authentication credentials',
                'name': 'AuthenticationError',
                'path': [path],
                'extensions': {
                    'code': 'UNAUTHENTICATED',
                },
            })],
        })
    })
}

const expectToThrowAuthenticationErrorToObj = async (testFunc) => {
    await expectToThrowAuthenticationError(testFunc, 'obj')
}

const expectToThrowAuthenticationErrorToObjects = async (testFunc) => {
    await expectToThrowAuthenticationError(testFunc, 'objs')
}

const expectToThrowAuthenticationErrorToResult = async (testFunc) => {
    await expectToThrowAuthenticationError(testFunc, 'result')
}

const expectToThrowValidationFailureError = async (testFunc, messageContains, path = 'obj') => {
    if (!messageContains) throw new Error('expectToThrowValidationFailureError(): no message argument')
    await catchErrorFrom(testFunc, ({ errors }) => {
        expect(errors[0]).toMatchObject({
            message: 'You attempted to perform an invalid mutation',
            name: 'ValidationFailureError',
            path: [path],
        })
        if (messageContains) {
            expect(errors[0]).toMatchObject({
                originalError: {
                    data: {
                        messages: expect.arrayContaining([
                            expect.stringContaining(messageContains),
                        ]),

                    },
                },
            })
        }
    })
}

const expectToThrowMutationError = async (testFunc, messageContains, path = ['result'], name = 'GraphQLError') => {
    await catchErrorFrom(testFunc, ({ errors }) => {
        expect(errors[0]).toMatchObject({
            message: expect.stringContaining(messageContains),
            name,
            path,
        })
    })
}

const expectToThrowUserInputError = async (testFunc, messageContains, name = 'UserInputError') => {
    await catchErrorFrom(testFunc, ({ errors }) => {
        expect(errors[0]).toMatchObject({
            message: expect.stringContaining(messageContains),
            name,
        })
    })
}

const expectToThrowGraphQLRequestError = async (testFunc, message) => {
    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
        })

        const { errors, data } = caught
        expect(data).toBeUndefined()
        expect(errors).toHaveLength(1)
        expect(errors[0].message).toMatch(message)
        // NOTE(pahaz):
        //  ValidationError - The GraphQL operation is not valid against the server's schema.
        //  UserInputError - The GraphQL operation includes an invalid value for a field argument.
        //  SyntaxError - The GraphQL operation string contains a syntax error.
        expect(errors[0].name).toMatch(/(UserInputError|ValidationError|SyntaxError)/)
    })
}

module.exports = {
    catchErrorFrom,
    expectToThrowAccessDeniedError,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAccessDeniedErrorToObjects,
    expectToThrowAccessDeniedErrorToResult,
    expectToThrowAuthenticationError,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAuthenticationErrorToResult,
    expectToThrowValidationFailureError,
    expectToThrowMutationError,
    expectToThrowUserInputError,
    expectToThrowGraphQLRequestError,
}
