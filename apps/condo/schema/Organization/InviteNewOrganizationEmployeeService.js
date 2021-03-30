const { getById, GQLCustomSchema } = require('@core/keystone/schema')
const { User } = require('@condo/domains/user/utils/serverSchema')

const { findOrganizationEmployee, createOrganizationEmployee } = require('../../utils/serverSchema/Organization')

const { rules } = require('../../access')
const { ALREADY_EXISTS_ERROR } = require('@condo/domains/common/constants/errors')

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
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                const { organization, email, name, ...restData } = data
                let user

                // Note: check is already exists (email + organization)
                {
                    const objs = await findOrganizationEmployee(context, {
                        email,
                        organization: { id: organization.id },
                    })

                    if (objs.length > 0) {
                        const msg = `${ALREADY_EXISTS_ERROR}] User is already invited in the organization`
                        console.error(msg)
                        throw new Error(msg)
                    }
                }

                if (!user) {
                    const objs = await User.getAll(context, { email })

                    if (objs && objs.length === 1) {
                        user = objs[0]
                    }
                }

                // Note: check is already exists (user + organization)
                if (user) {
                    const objs = await findOrganizationEmployee(context, {
                        user: { id: user.id },
                        organization: { id: organization.id },
                    })

                    if (objs.length > 0) {
                        const msg = `${ALREADY_EXISTS_ERROR}] User is already invited in the organization`
                        console.error(msg)
                        throw new Error(msg)
                    }
                }

                const obj = await createOrganizationEmployee(context, {
                    user: (user) ? { connect: { id: user.id } } : undefined,
                    organization: { connect: { id: organization.id } },
                    email,
                    name,
                    ...restData,
                })

                // TODO(pahaz): send email !?!?!
                console.log('Fake send security email!')

                return await getById('OrganizationEmployee', obj.id)
            },
        },
    ],
})

module.exports = {
    InviteNewOrganizationEmployeeService,
}
