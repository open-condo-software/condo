/**
 * Generated by `createservice user.CheckUserExistenceService --type queries`
 */

const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema, find } = require('@open-condo/keystone/schema')

const { NOT_FOUND, WRONG_FORMAT, DV_VERSION_MISMATCH } = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const access = require('@condo/domains/user/access/CheckUserExistenceService')
const { ConfirmPhoneAction } = require('@condo/domains/user/utils/serverSchema')


/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const ERRORS = {
    MULTIPLE_USERS_FOUND: {
        query: 'checkUserExistence',
        code: NOT_FOUND,
        type: 'MULTIPLE_USERS_FOUND',
        message: 'Multiple users found',
    },
    INVALID_PHONE_NUMBER: {
        query: 'checkUserExistence',
        code: BAD_USER_INPUT,
        type: 'INVALID_PHONE_NUMBER',
        message: 'Invalid phone number',
    },
    TOKEN_NOT_FOUND: {
        query: 'checkUserExistence',
        variable: ['data', 'token'],
        code: NOT_FOUND,
        type: 'TOKEN_NOT_FOUND',
        message: 'Token not found',
    },
    DV_VERSION_MISMATCH: {
        query: 'checkUserExistence',
        variable: ['data', 'dv'],
        code: BAD_USER_INPUT,
        type: DV_VERSION_MISMATCH,
        message: 'Wrong value for data version number',
    },
    WRONG_SENDER_FORMAT: {
        query: 'checkUserExistence',
        variable: ['data', 'sender'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid format of "sender" field value',
        correctExample: '{ dv: 1, fingerprint: \'example-fingerprint-alphanumeric-value\'}',
    },
}

const CheckUserExistenceService = new GQLCustomSchema('CheckUserExistenceService', {
    types: [
        {
            access: true,
            type: 'input CheckUserExistenceInput { dv: Int!, sender: JSON!, confirmActionToken: String!, userType: UserTypeType! }',
        },
        {
            access: true,
            type: 'type CheckUserExistenceOutput { userIsExist: Boolean!, nameIsSet: Boolean!, emailIsSet: Boolean!, phoneIsSet: Boolean!, passwordIsSet: Boolean! }',
        },
    ],

    queries: [
        {
            access: access.canCheckUserExistence,
            schema: 'checkUserExistence(data: CheckUserExistenceInput!): CheckUserExistenceOutput',
            doc: {
                summary: 'Using an action token with a verified phone number,' +
                    ' checks whether a user with the specified type (resident, staff, service) is registered.\n' +
                    'As a result, information about the completion of some important fields (name, email, phone, password) is also returned.',
                errors: ERRORS,
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                const { confirmActionToken, userType } = data

                checkDvAndSender(data, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

                if (!confirmActionToken) throw new GQLError(ERRORS.TOKEN_NOT_FOUND, context)

                const action = await ConfirmPhoneAction.getOne(context,
                    {
                        token: confirmActionToken,
                        expiresAt_gte: new Date().toISOString(),
                        completedAt: null,
                        isPhoneVerified: true,
                    },
                )
                if (!action) throw new GQLError(ERRORS.TOKEN_NOT_FOUND, context)

                const phoneFromAction = normalizePhone(action.phone) || null
                if (!phoneFromAction) throw new GQLError(ERRORS.INVALID_PHONE_NUMBER, context)

                const users = await find('User', { type: userType, phone: action.phone })
                if (users.length > 1) throw new GQLError(ERRORS.MULTIPLE_USERS_FOUND, context)

                const user = users[0]
                const result = {
                    userIsExist: false,
                    nameIsSet: false,
                    emailIsSet: false,
                    phoneIsSet: false,
                    passwordIsSet: false,
                }

                if (!user || user.deletedAt) return result

                result.userIsExist = true
                result.nameIsSet = Boolean(get(user, 'name', null))
                result.emailIsSet = Boolean(get(user, 'email', null))
                result.phoneIsSet = Boolean(get(user, 'phone', null))
                result.passwordIsSet = Boolean(get(user, 'password', null))

                return result
            },
        },
    ],
})

module.exports = {
    CheckUserExistenceService,
    ERRORS,
}