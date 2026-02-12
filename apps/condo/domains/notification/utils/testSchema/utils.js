const { faker } = require('@faker-js/faker')
const get = require('lodash/get')
const sample = require('lodash/sample')

const {
    PUSH_TRANSPORT_TYPES,
    DEVICE_PLATFORM_TYPES,
    PUSH_FAKE_TOKEN_SUCCESS,
    PUSH_FAKE_TOKEN_FAIL,
} = require('@condo/domains/notification/constants/constants')

const getRandomFakeSuccessToken = () => `${PUSH_FAKE_TOKEN_SUCCESS}-${faker.datatype.uuid()}`
const getRandomFakeFailToken = () => `${PUSH_FAKE_TOKEN_FAIL}-${faker.datatype.uuid()}`

const getRandomTokenData = (extraAttrs = {}) => {
    const pushTransport = get(extraAttrs, 'pushTransport') || sample(PUSH_TRANSPORT_TYPES)
    const devicePlatform = sample(DEVICE_PLATFORM_TYPES)
    const pushToken = faker.datatype.uuid()

    return {
        deviceId: faker.datatype.uuid(),
        appId: faker.datatype.uuid(),
        pushToken,
        pushTransport,
        devicePlatform,
        pushTokenVoIP: pushToken,
        pushTransportVoIP: pushTransport,
        meta: { pushTransport },
        ...extraAttrs,
    }
}

/**
 * Mimics redStore request result
 * @returns {{responses: *[], successCount: number, failureCount: number}}
 */
function getEmptyResult () {
    return {
        responses: [],
        successCount: 0,
        failureCount: 0,
    }
}

/**
 * Mimics redStore failure response
 * @returns {{success: boolean, error: {errorInfo: {code: string, message: string}}}}
 */
function getFakeErrorResponse () {
    return {
        success: false,
        type: 'Fake',
        error: {
            errorInfo: {
                code: 'fake-error',
                message: 'Fake error message',
                status: 403,
            },
        },
    }
}

/**
 * Mimics redStore success response
 * @returns {{success: boolean, messageId: string}}
 */
function getFakeSuccessResponse () {
    return {
        success: true,
        type: 'Fake',
        messageId: `fake-success-message/${faker.datatype.uuid()}`,
    }
}

module.exports = {
    getRandomTokenData,
    getRandomFakeSuccessToken,
    getRandomFakeFailToken,
    getEmptyResult,
    getFakeErrorResponse,
    getFakeSuccessResponse,
}