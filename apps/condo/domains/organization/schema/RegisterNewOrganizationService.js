const { getById, GQLCustomSchema } = require('@open-condo/keystone/schema')

const { createTourStepsForOrganization } = require('@condo/domains/onboarding/utils/serverSchema')
const access = require('@condo/domains/organization/access/RegisterNewOrganizationService')
const { ORGANIZATION_TYPES } = require('@condo/domains/organization/constants/common')
const { createConfirmedEmployee, createOrganization, createDefaultRoles, pushOrganizationToSalesCRM } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { createDefaultPropertyScopeForNewOrganization } = require('@condo/domains/scope/utils/serverSchema')
const { TicketOrganizationSetting } = require('@condo/domains/ticket/utils/serverSchema')

const RegisterNewOrganizationService = new GQLCustomSchema('RegisterNewOrganizationService', {
    types: [
        {
            access: true,
            type: `enum OrganizationType { ${ORGANIZATION_TYPES.join(' ')} }`,
        },
        {
            access: true,
            type: 'input RegisterNewOrganizationInput { dv: Int!, sender: SenderFieldInput!, country: String!, name: String!, tin: String!, description: String, meta: JSON!, avatar: Upload, type: OrganizationType }',
        },
    ],
    mutations: [
        {
            access: access.canRegisterNewOrganization,
            schema: 'registerNewOrganization(data: RegisterNewOrganizationInput!): Organization',
            doc: {
                summary: 'Registers new Organization for current user',
                description: 'Creates new Organization, new OrganizationEmployee for current user, creates a set of default OrganizationEmployeeRole for organization and connects created OrganizationEmployee to "Admin" OrganizationEmployeeRole',
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                const dvSenderData = { dv: data.dv, sender: data.sender }
                const organization = await createOrganization(context, data)
                await createDefaultPropertyScopeForNewOrganization(context, organization, dvSenderData)
                const defaultRoles = await createDefaultRoles(context, organization, dvSenderData)
                const adminRole = defaultRoles.Administrator
                await createConfirmedEmployee(context, organization, context.authedItem, adminRole, dvSenderData)
                await createTourStepsForOrganization(context, organization, dvSenderData)
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
