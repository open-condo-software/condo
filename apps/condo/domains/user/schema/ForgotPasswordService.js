const { pick } = require('lodash')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema, getByCondition } = require('@open-condo/keystone/schema')

const { COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const { STAFF } = require('@condo/domains/user/constants/common')
const { GQL_ERRORS: USER_ERRORS, TOKEN_NOT_FOUND, USER_NOT_FOUND } = require('@condo/domains/user/constants/errors')
const { ConfirmPhoneAction, User } = require('@condo/domains/user/utils/serverSchema')


/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const ERRORS = {
    changePasswordWithToken: {
        ...pick(USER_ERRORS, [
            'WRONG_PASSWORD_FORMAT',
            'INVALID_PASSWORD_LENGTH',
            'PASSWORD_CONTAINS_EMAIL',
            'PASSWORD_CONTAINS_PHONE',
            'PASSWORD_IS_FREQUENTLY_USED',
            'PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS',
        ]),
        TOKEN_NOT_FOUND: {
            mutation: 'changePasswordWithToken',
            variable: ['data', 'token'],
            code: BAD_USER_INPUT,
            type: TOKEN_NOT_FOUND,
            message: 'Unable to find non-expired ConfirmPhoneAction by specified token',
            messageForUser: 'api.user.changePasswordWithToken.TOKEN_NOT_FOUND',
        },
        USER_NOT_FOUND: {
            mutation: 'changePasswordWithToken',
            variable: ['data', 'phone'],
            code: BAD_USER_INPUT,
            type: USER_NOT_FOUND,
            message: 'Unable to find user with specified phone',
            messageForUser: 'api.user.changePasswordWithToken.USER_NOT_FOUND',
        },
        DV_VERSION_MISMATCH: {
            ...COMMON_ERRORS.DV_VERSION_MISMATCH,
            query: 'changePasswordWithToken',
        },
        WRONG_SENDER_FORMAT: {
            ...COMMON_ERRORS.WRONG_SENDER_FORMAT,
            query: 'changePasswordWithToken',
        },
    },
}

const USER_ERROR_MAPPING = {
    '[password:minLength:User:password]': ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
    '[password:rejectCommon:User:password]': ERRORS.changePasswordWithToken.PASSWORD_IS_FREQUENTLY_USED,
    [ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH.message]: ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
    [ERRORS.changePasswordWithToken.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS.message]: ERRORS.changePasswordWithToken.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
    [ERRORS.changePasswordWithToken.PASSWORD_CONTAINS_EMAIL.message]: ERRORS.changePasswordWithToken.PASSWORD_CONTAINS_EMAIL,
    [ERRORS.changePasswordWithToken.PASSWORD_CONTAINS_PHONE.message]: ERRORS.changePasswordWithToken.PASSWORD_CONTAINS_PHONE,
}

const ForgotPasswordService = new GQLCustomSchema('ForgotPasswordService', {
    types: [
        {
            access: true,
            type: 'input ChangePasswordWithTokenInput { token: String!, password: String!, sender: SenderFieldInput!, dv: Int! }',
        },
        {
            access: true,
            type: 'type ChangePasswordWithTokenOutput { status: String!, phone: String! }',
        },

    ],
    mutations: [
        {
            access: true,
            schema: 'changePasswordWithToken(data: ChangePasswordWithTokenInput!): ChangePasswordWithTokenOutput @deprecated(reason: "Please use `changeUserPassword` mutation")',
            doc: {
                summary: 'Changes password this action via correct token, that should correspond to ConfirmPhoneAction.' +
                    '\nOnly used for staff users',
                errors: ERRORS.changePasswordWithToken,
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                const { token, password, sender } = data

                checkDvAndSender(
                    data,
                    ERRORS.changePasswordWithToken.DV_VERSION_MISMATCH,
                    ERRORS.changePasswordWithToken.WRONG_SENDER_FORMAT,
                    context
                )

                if (!password) {
                    throw new GQLError(ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH, context)
                }

                if (!token) throw new GQLError(ERRORS.changePasswordWithToken.TOKEN_NOT_FOUND, context)

                const tokenAction = await getByCondition('ConfirmPhoneAction', {
                    token,
                    expiresAt_gte: new Date().toISOString(),
                    completedAt: null,
                    isPhoneVerified: true,
                    deletedAt: null,
                })

                if (!tokenAction) throw new GQLError(ERRORS.changePasswordWithToken.TOKEN_NOT_FOUND, context)

                const user = await getByCondition('User', {
                    type: STAFF,
                    phone: tokenAction.phone,
                    deletedAt: null,
                })

                if (!user) {
                    throw new GQLError(ERRORS.changePasswordWithToken.USER_NOT_FOUND, context)
                }

                await User.update(context, user.id, { dv: 1, sender, password }, 'id', { errorMapping: USER_ERROR_MAPPING })

                await ConfirmPhoneAction.update(context, tokenAction.id, { dv: 1, sender, completedAt: new Date().toISOString() })

                return { status: 'ok', phone: user.phone }
            },
        },
    ],
})

module.exports = {
    ForgotPasswordService,
    ERRORS,
}
