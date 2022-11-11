/**
 * Callback function to examine GraphQLError, thrown by Keystone
 * @callback ErrorInspectionCallback
 * @param {GraphQLError} error
 */

import conf from '@open-condo/config'
import { getTranslations } from '@open-condo/locales/loader'
import { template } from 'lodash'

/**
 * Function, expected to throw an error
 * @callback TestFunc
 */

const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')

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
    let thrownError = null
    try {
        await testFunc()
    } catch (e) {
        thrownError = e
    }
    if (!thrownError) throw new Error('catchErrorFrom() error not found (miniapp)')
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
export const expectToThrowAccessDeniedError = async (testFunc, path) => {
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
export const expectToThrowAccessDeniedErrorToObj = async (testFunc) => {
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
export const expectToThrowAccessDeniedErrorToObjects = async (testFunc) => {
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
export const expectToThrowAccessDeniedErrorToResult = async (testFunc) => {
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
export const expectToThrowAuthenticationError = async (testFunc, path = 'objs') => {
    await catchErrorFrom(testFunc, ({ errors, data }) => {
        expect(errors[0]).toMatchObject({
            'message': 'No or incorrect authentication credentials',
            'name': 'GraphQLError',
            'path': [path],
            'extensions': {
                'code': 'UNAUTHENTICATED',
            },
        })
        expect(data).toEqual({ [path]: null })
    })
}

export const expectToThrowValidationFailureError = async (testFunc, messageContains = undefined, path = 'obj') => {
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

export const expectToThrowMutationError = async (testFunc, messageContains, path = ['result'], name = 'GraphQLError') => {
    await catchErrorFrom(testFunc, ({ errors }) => {
        expect(errors[0]).toMatchObject({
            message: expect.stringContaining(messageContains),
            name,
            path,
        })
    })
}

export const expectToThrowUserInputError = async (testFunc, messageContains, name = 'UserInputError') => {
    await catchErrorFrom(testFunc, ({ errors }) => {
        expect(errors[0]).toMatchObject({
            message: expect.stringContaining(messageContains),
            name,
        })
    })
}

export const expectToThrowAuthenticationErrorToObj = async (testFunc) => {
    return await expectToThrowAuthenticationError(testFunc, 'obj')
}

export const expectToThrowAuthenticationErrorToObjects = async (testFunc) => {
    return await expectToThrowAuthenticationError(testFunc, 'objs')
}

export const expectToThrowAuthenticationErrorToResult = async (testFunc) => {
    return await expectToThrowAuthenticationError(testFunc, 'result')
}

export const expectToThrowGQLError = async (testFunc, errorFields, path = 'obj') => {
    if (isEmpty(errorFields) || typeof errorFields !== 'object') throw new Error('expectToThrowGQLError(): wrong errorFields argument')
    if (!errorFields.code || !errorFields.type) throw new Error('expectToThrowGQLError(): errorFields argument: no code or no type')
    let interpolatedMessageForUser
    if (errorFields.messageForUser) {
        const locale = conf.DEFAULT_LOCALE
        const translations = getTranslations(locale)
        const translatedMessage = translations[errorFields.messageForUser]
        interpolatedMessageForUser = template(translatedMessage)(errorFields.messageInterpolation)
        if (!interpolatedMessageForUser) throw new Error(`expectToThrowGQLError(): you need to set ${errorFields.messageForUser} for locale=${locale}`)
    }
    const message = template(errorFields.message)(errorFields.messageInterpolation)

    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            data: { [path]: null },
            errors: [expect.objectContaining({
                message,
                name: 'GraphQLError',
                path: [path],
                'locations': [expect.objectContaining({
                    line: expect.anything(),
                    column: expect.anything(),
                })],
                'extensions': expect.objectContaining({
                    ...errorFields,
                }),
            })],
        })
    })
}
