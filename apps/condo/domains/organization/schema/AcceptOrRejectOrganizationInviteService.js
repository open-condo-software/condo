const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const { getById, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@condo/domains/organization/access/AcceptOrRejectOrganizationInviteService')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')
const { NOT_FOUND, DV_VERSION_MISMATCH } = require('@condo/domains/common/constants/errors')

const errors = {
    acceptOrRejectOrganizationInviteById: {
        INVITE_NOT_FOUND: {
            mutation: 'acceptOrRejectOrganizationInviteById',
            variable: ['id'],
            code: BAD_USER_INPUT,
            type: NOT_FOUND,
            message: 'Cannot find specified Invite with following id: {id}',
        },
        DV_VERSION_MISMATCH: {
            mutation: 'acceptOrRejectOrganizationInviteById',
            variable: ['data', 'dv'],
            code: BAD_USER_INPUT,
            type: DV_VERSION_MISMATCH,
            message: 'Wrong value for data version number',
        },
    },
    acceptOrRejectOrganizationInviteByCode: {
        INVITE_NOT_FOUND: {
            mutation: 'acceptOrRejectOrganizationInviteByCode',
            variable: ['inviteCode'],
            code: BAD_USER_INPUT,
            type: NOT_FOUND,
            message: 'Cannot find specified Invite with following inviteCode: {inviteCode}',
        },
        DV_VERSION_MISMATCH: {
            mutation: 'acceptOrRejectOrganizationInviteByCode',
            variable: ['data', 'dv'],
            code: BAD_USER_INPUT,
            type: DV_VERSION_MISMATCH,
            message: 'Wrong value for data version number',
        },

    },
}

const AcceptOrRejectOrganizationInviteService = new GQLCustomSchema('AcceptOrRejectOrganizationInviteService', {
    types: [
        {
            access: true,
            type: 'input AcceptOrRejectOrganizationInviteInput { dv: Int!, sender: SenderFieldInput!, isRejected: Boolean, isAccepted: Boolean }',
        },
    ],
    mutations: [
        {
            access: access.canAcceptOrRejectOrganizationInvite,
            // todo(DOMA-2305) Use type instead of ID!
            schema: 'acceptOrRejectOrganizationInviteById(id: ID!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { id, data } = args
                const authedItem = context.authedItem
                if (!authedItem.id) throw new Error('Internal error inside the access check. We assume that the user should exists!')
                let { isRejected, isAccepted, dv, sender } = data
                if (dv !== 1) throw new GQLError(errors.acceptOrRejectOrganizationInviteById.DV_VERSION_MISMATCH)
                isRejected = isRejected || false
                isAccepted = isAccepted || false

                let employee = await OrganizationEmployee.getOne(context, { id, deletedAt: null })
                if (!employee) throw new GQLError({ ...errors.acceptOrRejectOrganizationInviteById.INVITE_NOT_FOUND, messageInterpolation: { id } })

                // if the user accepts the invitation, then update the name, phone number and email address of the employee
                if (isAccepted) {
                    employee = await OrganizationEmployee.update(context, employee.id, {
                        dv: 1,
                        sender,
                        isRejected,
                        isAccepted,
                        name: authedItem.name ? authedItem.name : null,
                        phone: authedItem.phone ? authedItem.phone : null,
                        email: authedItem.email ? authedItem.email : null,
                    })
                } else {
                    employee = await OrganizationEmployee.update(context, employee.id, {
                        dv: 1,
                        sender,
                        isRejected,
                        isAccepted,
                    })
                }

                return await getById('OrganizationEmployee', employee.id)
            },
        },
        {
            access: access.canAcceptOrRejectOrganizationInvite,
            schema: 'acceptOrRejectOrganizationInviteByCode(inviteCode: String!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { inviteCode, data } = args
                const authedItem = context.authedItem
                if (!authedItem.id) throw new Error('Internal error inside the access check. We assume that the user should exists!')
                let { isRejected, isAccepted, sender, dv } = data
                if (dv !== 1) throw new GQLError(errors.acceptOrRejectOrganizationInviteByCode.DV_VERSION_MISMATCH)
                isRejected = isRejected || false
                isAccepted = isAccepted || false


                let employee = await OrganizationEmployee.getOne(context, { inviteCode, user_is_null: true, deletedAt: null })
                if (!employee) throw new GQLError({ ...errors.acceptOrRejectOrganizationInviteByCode.INVITE_NOT_FOUND, messageInterpolation: { inviteCode } })

                // if the user accepts the invitation, then update the name, phone number and email address of the employee
                if (isAccepted) {
                    employee = await OrganizationEmployee.update(context, employee.id, {
                        dv: 1,
                        sender,
                        user: { connect: { id: context.authedItem.id } },
                        isRejected,
                        isAccepted,
                        name: authedItem.name ? authedItem.name : null,
                        phone: authedItem.phone ? authedItem.phone : null,
                        email: authedItem.email ? authedItem.email : null,
                    })
                } else {
                    employee = await OrganizationEmployee.update(context, employee.id, {
                        dv: 1,
                        sender,
                        user: { connect: { id: context.authedItem.id } },
                        isRejected,
                        isAccepted,
                    })
                }

                return await getById('OrganizationEmployee', employee.id)
            },
        },
    ],
})

module.exports = {
    AcceptOrRejectOrganizationInviteService,
}