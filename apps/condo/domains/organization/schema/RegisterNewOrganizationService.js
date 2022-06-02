const { createConfirmedEmployee, createOrganization, createDefaultRoles, pushOrganizationToSalesCRM } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { getById, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@condo/domains/organization/access/RegisterNewOrganizationService')
const { createTrialSubscription } = require('@condo/domains/subscription/utils/serverSchema/ServiceSubscription')

const RegisterNewOrganizationService = new GQLCustomSchema('RegisterNewOrganizationService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewOrganizationInput { dv: Int!, sender: SenderFieldInput!, country: String!, name: String!, tin: String!, description: String, meta: JSON!, avatar: Upload }',
        },
    ],
    mutations: [
        {
            access: access.canRegisterNewOrganization,
            schema: 'registerNewOrganization(data: RegisterNewOrganizationInput!): Organization',
            doc: {
                summary: 'Registers new Organization for current user',
                description: 'Creates new Organization, new OrganizationEmployee for current user, creates a set of default OrganizationEmployeeRole for organization and connects created OrganizationEmployee to "Admin" OrganizationEmployeeRole, creates trial ServiceSubscription for organization',
            },
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const extraData = { dv: data.dv, sender: data.sender }
                const organization = await createOrganization(context, data)
                const defaultRoles = await createDefaultRoles(context, organization, extraData)
                const adminRole = defaultRoles.Administrator
                await createConfirmedEmployee(context, organization, context.authedItem, adminRole, extraData)
                await createTrialSubscription(context, organization, extraData)
                pushOrganizationToSalesCRM(organization)
                return await getById('Organization', organization.id)
            },
        },
    ],
})

module.exports = {
    RegisterNewOrganizationService,
}
