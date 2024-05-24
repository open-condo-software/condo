const {
    COLD_WATER_METER_RESOURCE_ID,
} = require('@condo/domains/meter/constants/constants')
const { faker} = require("@faker-js/faker");

const { createTestMeter } = require('@condo/domains/meter/utils/testSchema')


const MeterTestMixin = {
    async initMixin () { },
    async createMeter ({ unitName, accountNumber, resourceId } = {}) {
        await createTestMeter(this.clients.admin, this.organization, this.property, { id: resourceId || COLD_WATER_METER_RESOURCE_ID }, {
            unitName: unitName || faker.random.alphaNumeric(8),
            accountNumber: accountNumber || faker.random.alphaNumeric(8),
        })
    },
}

module.exports = {
    MeterTestMixin,
}