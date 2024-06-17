const { faker  } = require('@faker-js/faker/locale/ru')
const { OrganizationTestMixin } = require('./organization')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')

const PropertyTestMixin = {

    dependsOn: [OrganizationTestMixin],

    async initMixin () {
        const [property] = await createTestProperty(this.clients.admin, this.organization)
        this.property = property
    },

    createPropertyAddress () {
        return `${faker.address.cityName()} ${faker.address.streetAddress(false)}`
    },

    createAddressWithUnit () {
        return `${faker.address.cityName()} ${faker.address.streetAddress(true)}`
    },

}

module.exports = {
    PropertyTestMixin,
}