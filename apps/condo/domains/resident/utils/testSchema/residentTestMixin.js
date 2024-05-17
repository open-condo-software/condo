const { createTestResident } = require('./index')
const { createTestProperty } = require("@condo/domains/property/utils/testSchema");
const { faker} = require("@faker-js/faker");
const { makeClientWithResidentUser } = require("@condo/domains/user/utils/testSchema");

const ResidentTestMixin = {

    async initMixin () {},
    async createResidentClient () {
        const [property] = await createTestProperty(this.clients.admin, this.organization)
        const unitName = faker.random.alphaNumeric(8)
        const residentClient = await makeClientWithResidentUser()
        const [resident] = await createTestResident(this.clients.admin, residentClient.user, property, {
            unitName,
        })
        residentClient.resident = resident
        return residentClient
    }

}

module.exports = {
    ResidentTestMixin,
}