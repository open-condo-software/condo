const passwordGenerator = require('generate-password')
const { getById, GQLCustomSchema } = require('@core/keystone/schema')

const { createOrganizationEmployee } = require('../../../utils/serverSchema/Organization')
const { rules } = require('../../../access')
const guards = require('../utils/serverSchema/guards')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { PHONE_WRONG_FORMAT_ERROR } = require('@condo/domains/common/constants/errors')
const { REGISTER_NEW_USER_MUTATION } = require('../../user/gql')

const InviteNewOrganizationEmployeeService = new GQLCustomSchema('InviteNewOrganizationEmployeeService', {
    types: [
        {
            access: true,
            type: 'input InviteNewOrganizationEmployeeInput { dv: Int!, sender: JSON!, organization: OrganizationWhereUniqueInput!, email: String!, phone: String, name: String, role: OrganizationEmployeeWhereUniqueInput, position: String}',
        },
    ],
    mutations: [
        {
            access: rules.canInviteEmployee,
            schema: 'inviteNewOrganizationEmployee(data: InviteNewOrganizationEmployeeInput!): OrganizationEmployee',
            resolver: async (parent, args, context) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                let { organization, email, phone, role, position, name, ...restData } = data
                phone = normalizePhone(phone)
                if (!phone) throw new Error(`${PHONE_WRONG_FORMAT_ERROR}phone] invalid format`)

                // TODO(pahaz): normalize email!

                let user = await guards.checkUserExistency(context, email, phone)
                await guards.checkEmployeeExistency(context, organization, email, phone, user)

                if (!user) {
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

                    user = registerData.user
                }

                const employee = await createOrganizationEmployee(context, {
                    user: { connect: { id: user.id } },
                    organization: { connect: { id: organization.id } },
                    ...role && { role: { connect: { id: role.id } } },
                    position,
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
