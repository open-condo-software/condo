const { createTestProperty } = require("@condo/domains/property/utils/testSchema");


const PropertyTestMixin = {
    async initMixin () {
        const [property] = await createTestProperty(this.clients.admin, this.organization)
        this.property = property
    },
    async addUnitToProperty (unitName) {

    },
}

module.exports = {
    PropertyTestMixin,
}