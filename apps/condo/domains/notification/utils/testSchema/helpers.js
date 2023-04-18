const { faker } = require('@faker-js/faker')
const { get, sample } = require('lodash')

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

module.exports = {
    getRandomTokenData,
    getRandomFakeSuccessToken,
    getRandomFakeFailToken,
}