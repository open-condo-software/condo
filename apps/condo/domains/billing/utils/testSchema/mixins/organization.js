const {
    createTestOrganization,
    updateTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')
const {
    makeClientWithNewRegisteredAndLoggedInUser,
} = require('@condo/domains/user/utils/testSchema')


const OrganizationTestMixin = {

    async initMixin () {
        const [organization] = await createTestOrganization(this.clients.admin)
        this.organization = organization
    },

    async createEmployee (type, rights) {
        this.clients.employee[type] = await makeClientWithNewRegisteredAndLoggedInUser()
        const [role] = await createTestOrganizationEmployeeRole(this.clients.admin, this.organization, rights)
        await createTestOrganizationEmployee(this.clients.admin, this.organization, this.clients.employee[type].user, role)
    },

    async updateOrganization (updateInput) {
        const [updatedOrganization] = await updateTestOrganization(this.clients.admin, this.organization.id, updateInput)
        this.organization = updatedOrganization
    }

}

module.exports = {
    OrganizationTestMixin,
}