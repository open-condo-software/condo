const faker = require('faker')
const sample = require('lodash/sample')

const { PUSH_TRANSPORT_TYPES } = require('@condo/domains/notification/constants/constants')

const getRandomTokenData = (extraAttrs = {}) => {
    const pushTransport = sample(PUSH_TRANSPORT_TYPES)

    return {
        deviceId: faker.datatype.uuid(),
        pushToken: faker.datatype.uuid(),
        pushTransport,
        meta: { pushTransport },
        ...extraAttrs,
    }
}

module.exports = {
    getRandomTokenData,
}