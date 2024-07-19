const { faker } = require('@faker-js/faker')

const { createTestResident, createTestServiceConsumer, updateTestServiceConsumer } = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')

const { AcquiringTestMixin } = require('./acquiring')
const { BillingTestMixin } = require('./billing')
const { OrganizationTestMixin } = require('./organization')
const { PropertyTestMixin } = require('./property')


const ResidentTestMixin = {

    dependsOn: [OrganizationTestMixin, PropertyTestMixin, BillingTestMixin, AcquiringTestMixin],

    async initMixin () {
        this.clients.resident = await makeClientWithResidentUser()
    },

    async createResident ({ unitName, unitType } = {}) {
        const [resident] = await createTestResident(this.clients.admin, this.clients.resident.user, this.property, {
            unitName: unitName || faker.random.alphaNumeric(8),
            unitType: unitType || 'flat',
        })
        return resident
    },

    async createServiceConsumer (resident, accountNumber) {
        return await createTestServiceConsumer(this.clients.admin, resident, this.organization, {
            accountNumber,
            billingIntegrationContext: { connect: { id: this.billingContext.id } },
            acquiringIntegrationContext: { connect: { id: this.acquiringContext.id } },
        })
    },

    async updateServiceConsumer (id, updateInput) {
        return await updateTestServiceConsumer(this.clients.admin, id, updateInput)
    },

}

module.exports = {
    ResidentTestMixin,
}