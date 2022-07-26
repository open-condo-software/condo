const faker = require('faker')
const sample = require('lodash/sample')

const { PUSH_TRANSPORT_TYPES, DEVICE_PLATFORM_TYPES } = require('@condo/domains/notification/constants/constants')

const getRandomTokenData = (extraAttrs = {}) => {
    const pushTransport = sample(PUSH_TRANSPORT_TYPES)
    const devicePlatform = sample(DEVICE_PLATFORM_TYPES)

    return {
        deviceId: faker.datatype.uuid(),
        appId: faker.datatype.uuid(),
        pushToken: faker.datatype.uuid(),
        pushTransport,
        devicePlatform,
        meta: { pushTransport },
        ...extraAttrs,
    }
}

module.exports = {
    getRandomTokenData,
}