/**
 * Callback function to examine GraphQLError, thrown by Keystone
 * @callback ErrorInspectionCallback
 * @param {GraphQLError} error
 */

/**
 * Function, expected to throw an error
 * @callback TestFunc
 */

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
export const expectToThrowAccessDeniedErrorToObj = async (testFunc) => {
    await catchErrorFrom(testFunc, ({errors, data}) => {
        expect(errors[0]).toMatchObject({
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['obj'],
        })
        expect(data).toEqual({ 'obj': null })
    })
}

/**
 * @deprecated
 * THIS FUNCTION IS DEPRECATED. We want to to separate access rights errors from non-authorization errors!
 * Please use expectToThrowAccessDeniedErrorToObjects!
 *
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
export const expectToThrowAccessDeniedErrorToObjects = async (testFunc) => {
    await catchErrorFrom(testFunc, ({errors, data}) => {
        expect(errors[0]).toMatchObject({
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
        expect(data).toEqual({ 'objs': null })
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
export const expectToThrowAuthenticationErrorToObjects = async (testFunc) => {
    await catchErrorFrom(testFunc, ({ errors, data }) => {
        expect(errors[0]).toMatchObject({
            'message': 'No or incorrect authentication credentials',
            'name': 'AuthenticationError',
            'path': ['objs'],
            'extensions': {
                'code': 'UNAUTHENTICATED'
            }
        })
        expect(data).toEqual({ 'objs': null })
    })
}
