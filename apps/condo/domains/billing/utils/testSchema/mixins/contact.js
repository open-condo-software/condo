const {
    createTestContact,
    updateTestContact,
} = require('@condo/domains/contact/utils/testSchema')

const ContactTestMixin = {

    async initMixin () { },

    async createContact (createInput = {}) {
        return await createTestContact(this.clients.admin, this.organization, this.property, createInput)
    },

    async updateContact (id, updateInput = {}) {
        return await updateTestContact(this.clients.admin, id, updateInput)
    }

}

module.exports = {
    ContactTestMixin,
}