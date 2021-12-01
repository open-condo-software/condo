/**
 * Callback function to examine GraphQLError, thrown by Keystone
 * @callback ErrorInspectionCallback
 * @param {GraphQLError} error
 */

/**
 * Function, expected to throw an error
 * @callback TestFunc
 */

const get = require('lodash/get')

/**
 * Implements correct expecting of GraphQLError, thrown by Keystone.
 * Expectation checks inside of `catch` are not covering a case,
 * when no exception is thrown, — test will pass, but should fail.
 * https://stackoverflow.com/questions/48707111/asserting-against-thrown-error-objects-in-jest
 *
 * @example
 * catchErrorFrom(async () => {
 *     await doSomethingThatShouldThrowAnError()
 * }, (e) => {
 *     // any `expect` checks for catched error
 * })
 *
 *
 * @param {TestFunc} testFunc - Function, expected to throw an error
 * @param {ErrorInspectionCallback} inspect - Function, that should inspect the error in details
 * @return {Promise<*>}
 */
export const catchErrorFrom = async (testFunc, inspect) => {
    let thrownError
    try {
        await testFunc()
    } catch (e) {
        thrownError = e
    }
    expect(thrownError).toBeDefined()
    return inspect(thrownError)
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
export const expectToThrowAccessDeniedErrorToObj = async (testFunc, path = ['obj']) => {
    await catchErrorFrom(testFunc, ({errors, data}) => {
        const expectedError = {
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
        }

        if (path) expectedError.path = path

        expect(errors[0]).toMatchObject(expectedError)

        if (path) expect(get(data, path)).toBeNull()
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
export const expectToThrowAccessDeniedErrorToObjects = async (testFunc, path = ['objs']) => {
    await catchErrorFrom(testFunc, ({errors, data}) => {
        const expectedError = {
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
        }

        if (path) expectedError.path = path

        expect(errors[0]).toMatchObject(expectedError)

        if (path) expect(get(data, path)).toBeNull()
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
export const expectToThrowAccessDeniedErrorToResult = async (testFunc ) => {
    await catchErrorFrom(testFunc, ({ errors, data }) => {
        expect(errors[0]).toMatchObject({
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['result'],
        })
        expect(data).toEqual({ 'result': null })
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
export const expectToThrowAuthenticationError = async (testFunc, path='objs') => {
    await catchErrorFrom(testFunc, ({ errors, data }) => {
        expect(errors[0]).toMatchObject({
            'message': 'No or incorrect authentication credentials',
            'name': 'AuthenticationError',
            'path': [path],
            'extensions': {
                'code': 'UNAUTHENTICATED'
            }
        })
        expect(data).toEqual({ [path]: null })
    })
}

export const expectToThrowValidationFailureError = async (testFunc, messageContains = undefined, path = 'obj') => {
    await catchErrorFrom(testFunc, ({errors}) => {
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
                            expect.stringContaining(messageContains)
                        ])

                    }
                }
            })
        }
    })
}

export const expectToThrowMutationError = async (testFunc, messageContains, path = ['result']) => {
    await catchErrorFrom(testFunc, ({errors}) => {
        expect(errors[0]).toMatchObject({
            message: expect.stringContaining(messageContains),
            name: 'GraphQLError',
            path
        })
    })
}

export const expectToThrowAuthenticationErrorToObj = async (testFunc) => {
    return await expectToThrowAuthenticationError(testFunc, 'obj')
}

export const expectToThrowAuthenticationErrorToObjects = async (testFunc) => {
    return await expectToThrowAuthenticationError(testFunc, 'objs')
}
