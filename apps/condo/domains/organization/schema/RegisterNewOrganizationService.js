const { createConfirmedEmployee, createOrganization, createDefaultRoles } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { getById, GQLCustomSchema } = require('@core/keystone/schema')
const { rules } = require('../../../access')

const RegisterNewOrganizationService = new GQLCustomSchema('RegisterNewOrganizationService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewOrganizationInput { dv: Int!, sender: JSON!, country: String!, name: String!, description: String, meta: JSON!, avatar: Upload }',
        },
    ],
    mutations: [
        {
            access: rules.canRegisterNewOrganization,
            schema: 'registerNewOrganization(data: RegisterNewOrganizationInput!): Organization',
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                const extraData = { dv: data.dv, sender: data.sender }
                const organization = await createOrganization(context, data)
                const defaultRoles = await createDefaultRoles(context, organization, extraData)
                const adminRole = defaultRoles[0]
                await createConfirmedEmployee(context, organization, context.authedItem, adminRole, extraData)
                return await getById('Organization', organization.id)
            },
        },
    ],
})

module.exports = {
    RegisterNewOrganizationService,
}
