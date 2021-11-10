const { createConfirmedEmployee, createOrganization, createDefaultRoles, pushToAmoCRM } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { getById, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@condo/domains/organization/access/RegisterNewOrganizationService')
const { createTrialSubscription } = require('@condo/domains/subscription/utils/serverSchema/ServiceSubscription')

const RegisterNewOrganizationService = new GQLCustomSchema('RegisterNewOrganizationService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewOrganizationInput { dv: Int!, sender: SenderFieldInput!, country: String!, name: String!, description: String, meta: JSON!, avatar: Upload }',
        },
    ],
    mutations: [
        {
            access: access.canRegisterNewOrganization,
            schema: 'registerNewOrganization(data: RegisterNewOrganizationInput!): Organization',
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                const extraData = { dv: data.dv, sender: data.sender }
                const organization = await createOrganization(context, data)
                const defaultRoles = await createDefaultRoles(context, organization, extraData)
                const adminRole = defaultRoles.Administrator
                await createConfirmedEmployee(context, organization, context.authedItem, adminRole, extraData)
                await createTrialSubscription(context, organization, extraData)
                pushToAmoCRM(organization)
                return await getById('Organization', organization.id)
            },
        },
    ],
})

module.exports = {
    RegisterNewOrganizationService,
}
