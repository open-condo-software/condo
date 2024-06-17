const { faker } = require('@faker-js/faker')

const {
    COLD_WATER_METER_RESOURCE_ID,
} = require('@condo/domains/meter/constants/constants')
const { createTestMeter } = require('@condo/domains/meter/utils/testSchema')

const { OrganizationTestMixin } = require('./organization')
const { PropertyTestMixin } = require('./property')

const MeterTestMixin = {

    dependsOn: [OrganizationTestMixin, PropertyTestMixin],

    async createMeter ({ unitName, accountNumber, resourceId } = {}) {
        return await createTestMeter(this.clients.admin, this.organization, this.property, { id: resourceId || COLD_WATER_METER_RESOURCE_ID }, {
            unitName: unitName || faker.random.alphaNumeric(8),
            accountNumber: accountNumber || faker.random.alphaNumeric(8),
        })
    },

}

module.exports = {
    MeterTestMixin,
}