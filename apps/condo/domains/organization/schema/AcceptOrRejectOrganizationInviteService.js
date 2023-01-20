const { get } = require('lodash')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getById, GQLCustomSchema } = require('@open-condo/keystone/schema')

const { NOT_FOUND, DV_VERSION_MISMATCH } = require('@condo/domains/common/constants/errors')
const access = require('@condo/domains/organization/access/AcceptOrRejectOrganizationInviteService')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')

const ERRORS = {
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
            resolver: async (parent, args, context) => {
                const { id, data } = args
                const authedItem = context.authedItem
                if (!authedItem.id) throw new Error('Internal error inside the access check. We assume that the user should exists!')
                let { isRejected, isAccepted, dv, sender } = data
                if (dv !== 1) throw new GQLError(ERRORS.acceptOrRejectOrganizationInviteById.DV_VERSION_MISMATCH)
                isRejected = isRejected || false
                isAccepted = isAccepted || false

                let employee = await OrganizationEmployee.getOne(context, { id, deletedAt: null })
                if (!employee) throw new GQLError({ ...ERRORS.acceptOrRejectOrganizationInviteById.INVITE_NOT_FOUND, messageInterpolation: { id } })

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
            resolver: async (parent, args, context) => {
                const { inviteCode, data } = args
                const authedItem = context.authedItem
                if (!authedItem.id) throw new Error('Internal error inside the access check. We assume that the user should exists!')
                let { isRejected, isAccepted, sender, dv } = data
                if (dv !== 1) throw new GQLError(ERRORS.acceptOrRejectOrganizationInviteByCode.DV_VERSION_MISMATCH)
                isRejected = isRejected || false
                isAccepted = isAccepted || false

                let employee = await OrganizationEmployee.getOne(context, { inviteCode, user_is_null: true, deletedAt: null })
                if (!employee) throw new GQLError({ ...ERRORS.acceptOrRejectOrganizationInviteByCode.INVITE_NOT_FOUND, messageInterpolation: { inviteCode } })

                // if the user accepts the invitation, then update the name, phone number and email address of the employee
                const needToUpdateUserData = isAccepted ? {
                    name: get(authedItem, 'name', null),
                    phone: get(authedItem, 'phone', null),
                    email: get(authedItem, 'email', null),
                } : {}
                employee = await OrganizationEmployee.update(context, employee.id, {
                    dv: 1,
                    sender,
                    user: { connect: { id: context.authedItem.id } },
                    isRejected,
                    isAccepted,
                    ...needToUpdateUserData,
                })

                return await getById('OrganizationEmployee', employee.id)
            },
        },
    ],
})

module.exports = {
    AcceptOrRejectOrganizationInviteService,
}