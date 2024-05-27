const {
    createTestContact,
    updateTestContact,
} = require('@condo/domains/contact/utils/testSchema')

const ContactTestMixin = {

    async initMixin () { },

    async createContact (createInput = {}) {
        return await createTestContact(this.clients.support, this.organization, this.property, createInput)
    },

    async updateContact (id, updateInput = {}) {
        return await updateTestContact(this.clients.support, id, updateInput)
    }

}

module.exports = {
    ContactTestMixin,
}