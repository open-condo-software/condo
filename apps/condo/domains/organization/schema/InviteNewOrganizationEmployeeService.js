const passwordGenerator = require('generate-password')
const { getById, GQLCustomSchema } = require('@core/keystone/schema')

const { createOrganizationEmployee } = require('../../../utils/serverSchema/Organization')
const { rules } = require('../../../access')
const guards = require('../utils/serverScheema/guards')
const { REGISTER_NEW_USER_MUTATION } = require('../../user/gql')

const InviteNewOrganizationEmployeeService = new GQLCustomSchema('InviteNewOrganizationEmployeeService', {
    types: [
        {
            access: true,
            type: 'input InviteNewOrganizationEmployeeInput { dv: Int!, sender: JSON!, organization: OrganizationWhereUniqueInput!, email: String!, phone: String, name: String }',
        },
    ],
    mutations: [
        {
            access: rules.canInviteEmployee,
            schema: 'inviteNewOrganizationEmployee(data: InviteNewOrganizationEmployeeInput!): OrganizationEmployee',
            resolver: async (parent, args, context) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                const { organization, email, phone, name, ...restData } = data

                await guards.checkEmployeeExistency(context, organization, email, phone)
                await guards.checkUserExistency(context, organization, email, phone)

                const password = passwordGenerator.generate({
                    length: 8,
                    numbers: true,
                })

                const userAttributes = {
                    name,
                    email,
                    phone,
                    password,
                    ...restData,
                }

                const { data: registerData, errors: registerErrors } = await context.executeGraphQL({
                    query: REGISTER_NEW_USER_MUTATION,
                    variables: {
                        data: userAttributes,
                    },
                })

                if (registerErrors) {
                    const msg = '[error] Unable to register user'
                    throw new Error(msg)
                }

                const employee = await createOrganizationEmployee(context, {
                    user: { connect: { id: registerData.user.id } },
                    organization: { connect: { id: organization.id } },
                    email,
                    name,
                    phone,
                    ...restData,
                })

                return await getById('OrganizationEmployee', employee.id)
            },
        },
    ],
})

module.exports = {
    InviteNewOrganizationEmployeeService,
}
