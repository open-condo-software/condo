const { updateOrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { getByCondition, getById, GQLCustomSchema } = require('@core/keystone/schema')
const { rules } = require('../../../access')

const AcceptOrRejectOrganizationInviteService = new GQLCustomSchema('AcceptOrRejectOrganizationInviteService', {
    types: [
        {
            access: true,
            type: 'input AcceptOrRejectOrganizationInviteInput { dv: Int!, sender: SenderFieldInput!, isRejected: Boolean, isAccepted: Boolean }',
        },
    ],
    mutations: [
        {
            access: rules.canAcceptOrRejectEmployeeInvite,
            schema: 'acceptOrRejectOrganizationInviteById(id: ID!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { id, data } = args
                const authedItem = context.authedItem
                let { isRejected, isAccepted, ...restData } = data
                isRejected = isRejected || false
                isAccepted = isAccepted || false

                let employee
                // if the user accepts the invitation, then update the name, phone number and email address of the employee
                if (isAccepted) {
                    employee = await updateOrganizationEmployee(context, id, {
                        isRejected,
                        isAccepted,
                        ...restData,
                        name: authedItem.name ? authedItem.name : null,
                        phone: authedItem.phone ? authedItem.phone : null,
                        email: authedItem.email ? authedItem.email : null,
                    })
                } else {
                    employee = await updateOrganizationEmployee(context, id, {
                        isRejected,
                        isAccepted,
                        ...restData,
                    })
                }

                return await getById('OrganizationEmployee', employee.id)
            },
        },
        {
            access: rules.canAcceptOrRejectEmployeeInvite,
            schema: 'acceptOrRejectOrganizationInviteByCode(inviteCode: String!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { inviteCode, data } = args
                let { isRejected, isAccepted, ...restData } = data
                isRejected = isRejected || false
                isAccepted = isAccepted || false

                const link = await getByCondition('OrganizationEmployee', { inviteCode, user_is_null: true })

                const obj = await updateOrganizationEmployee(context, link.id, {
                    user: { connect: { id: context.authedItem.id } },
                    isRejected,
                    isAccepted,
                    ...restData,
                })

                return await getById('OrganizationEmployee', obj.id)
            },
        },
    ],
})

module.exports = {
    AcceptOrRejectOrganizationInviteService,
}