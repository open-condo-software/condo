const { createConfirmedEmployee, createOrganization, createDefaultRoles, pushOrganizationToSalesCRM } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { getById, GQLCustomSchema } = require('@open-condo/keystone/schema')
const access = require('@condo/domains/organization/access/RegisterNewOrganizationService')
const { createTrialSubscription } = require('@condo/domains/subscription/utils/serverSchema/ServiceSubscription')
const { TicketOrganizationSetting } = require('@condo/domains/ticket/utils/serverSchema')

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
                const dvSenderData = { dv: data.dv, sender: data.sender }
                const organization = await createOrganization(context, data)
                const defaultRoles = await createDefaultRoles(context, organization, dvSenderData)
                const adminRole = defaultRoles.Administrator
                await createConfirmedEmployee(context, organization, context.authedItem, adminRole, dvSenderData)
                await createTrialSubscription(context, organization, dvSenderData)
                await TicketOrganizationSetting.create(context, {
                    ...dvSenderData,
                    organization: { connect: { id: organization.id } },
                })
                pushOrganizationToSalesCRM(organization)
                return await getById('Organization', organization.id)
            },
        },
    ],
})

module.exports = {
    RegisterNewOrganizationService,
}
