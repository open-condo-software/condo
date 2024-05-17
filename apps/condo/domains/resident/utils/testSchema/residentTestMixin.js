const { createTestResident } = require('./index')
const { faker} = require("@faker-js/faker");
const { makeClientWithResidentUser } = require("@condo/domains/user/utils/testSchema");

const ResidentTestMixin = {

    async initMixin () {
        this.clients.resident = await makeClientWithResidentUser()
    },
    async createResident ({ unitName, unitType } = {}) {
        const [resident] = await createTestResident(this.clients.admin, this.clients.resident.user, this.property, {
            unitName: unitName || faker.random.alphaNumeric(8),
            unitType: unitType || 'flat',
        })
        return resident
    }

}

module.exports = {
    ResidentTestMixin,
}