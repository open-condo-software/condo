const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { WRONG_PHONE_FORMAT, COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { STAFF, SERVICE } = require('@condo/domains/user/constants/common')
const { WRONG_CREDENTIALS, CAPTCHA_CHECK_FAILED } = require('@condo/domains/user/constants/errors')
const { captchaCheck } = require('@condo/domains/user/utils/hCaptcha')
const { authGuards, validateUserCredentials, ERROR_TYPES } = require('@condo/domains/user/utils/serverSchema/auth')

const { AUTH_FACTOR_TYPES } = require('../constants/authFactors')
const { NOT_ENOUGH_AUTH_FACTORS } = require('../constants/errors')
const { ConfirmPhoneAction, ConfirmEmailAction } = require('../utils/serverSchema')


/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const ERRORS = {
    WRONG_PHONE_FORMAT: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: BAD_USER_INPUT,
        type: WRONG_PHONE_FORMAT,
        variable: ['data', 'phone'],
        message: 'Wrong format of provided phone number',
        correctExample: '+79991234567',
        messageForUser: 'api.common.WRONG_PHONE_FORMAT',
    },
    WRONG_CREDENTIALS: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: BAD_USER_INPUT,
        type: WRONG_CREDENTIALS,
        message: 'Wrong phone or password',
        messageForUser: 'api.user.authenticateUserWithPhoneAndPassword.WRONG_CREDENTIALS',
    },
    CAPTCHA_CHECK_FAILED: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        variable: ['data', 'captcha'],
        code: BAD_USER_INPUT,
        type: CAPTCHA_CHECK_FAILED,
        message: 'Failed to check CAPTCHA',
        messageForUser: 'api.user.CAPTCHA_CHECK_FAILED',
    },
    DV_VERSION_MISMATCH: {
        ...COMMON_ERRORS.DV_VERSION_MISMATCH,
        mutation: 'authenticateUserWithPhoneAndPassword',
    },
    WRONG_SENDER_FORMAT: {
        ...COMMON_ERRORS.WRONG_SENDER_FORMAT,
        mutation: 'authenticateUserWithPhoneAndPassword',
    },
    NOT_ENOUGH_AUTH_FACTORS: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: BAD_USER_INPUT,
        type: NOT_ENOUGH_AUTH_FACTORS,
        message: 'Not enough auth factors',
        messageForUser: 'api.user.NOT_ENOUGH_AUTH_FACTORS',
    },
}

const AuthenticateUserWithPhoneAndPasswordService = new GQLCustomSchema('AuthenticateUserWithPhoneAndPasswordService', {
    types: [
        {
            access: true,
            type: `enum AuthenticateUserWithPhoneAndPasswordSecondFactorType { ${[AUTH_FACTOR_TYPES.CONFIRM_EMAIL_TOKEN, AUTH_FACTOR_TYPES.CONFIRM_PHONE_TOKEN].join(' ')} }`,
        },
        {
            access: true,
            type: 'input AuthenticateUserWithPhoneAndPasswordSecondFactorInput { value: String!, type: AuthenticateUserWithPhoneAndPasswordSecondFactorType! }',
        },
        {
            access: true,
            type: 'input AuthenticateUserWithPhoneAndPasswordInput { dv: Int, sender: SenderFieldInput, captcha: String, userType: UserTypeType, phone: String!, password: String!, secondFactor: AuthenticateUserWithPhoneAndPasswordSecondFactorInput }',
        },
        {
            access: true,
            type: 'type AuthenticateUserWithPhoneAndPasswordOutput { item: User, token: String! }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'authenticateUserWithPhoneAndPassword(data: AuthenticateUserWithPhoneAndPasswordInput!): AuthenticateUserWithPhoneAndPasswordOutput',
            doc: {
                summary: 'This mutation authorizes the user by phone and password',
                errors: ERRORS,
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                const {
                    password,
                    secondFactor,
                    captcha,

                    // NOTE: Previously we did not allow specifying the userType, dv and sender.
                    // And we do not want breaking changes, so we specify default values
                    dv = 1,
                    sender = { dv: 1, fingerprint: 'auth-by-phone-and-password' },
                    userType = STAFF,
                } = data

                const phone = normalizePhone(data.phone)

                await authGuards({ phone, userType }, context)

                if (captcha && userType !== SERVICE) {
                    const { error: captchaError } = await captchaCheck(context, captcha)
                    if (captchaError) {
                        throw new GQLError({ ...ERRORS.CAPTCHA_CHECK_FAILED, data: { error: captchaError } }, context)
                    }
                }

                checkDvAndSender({ dv, sender }, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

                if (!phone) {
                    throw new GQLError(ERRORS.WRONG_PHONE_FORMAT, context)
                }

                const validation = await validateUserCredentials(
                    { phone, userType },
                    {
                        password,
                        ...(secondFactor?.type === AUTH_FACTOR_TYPES.CONFIRM_EMAIL_TOKEN ? { confirmEmailToken: secondFactor?.value || '' } : null),
                        ...(secondFactor?.type === AUTH_FACTOR_TYPES.CONFIRM_PHONE_TOKEN ? { confirmPhoneToken: secondFactor?.value || '' } : null),
                    }
                )

                if (!validation.success) {
                    if (validation._error?.errorType === ERROR_TYPES.NOT_ENOUGH_AUTH_FACTORS) {
                        if (validation._error.is2FAEnabled) {
                            throw new GQLError({
                                ...ERRORS.NOT_ENOUGH_AUTH_FACTORS,
                                authDetails: {
                                    is2FAEnabled: validation._error.is2FAEnabled,
                                    userId: validation._error.userId,
                                    availableSecondFactors: validation._error.availableSecondFactors,
                                    maskedData: validation._error.maskedData,
                                },
                            }, context)
                        }
                    }

                    throw new GQLError(ERRORS.WRONG_CREDENTIALS, context)
                }

                if (validation.confirmEmailAction) {
                    await ConfirmEmailAction.update(context, validation.confirmEmailAction.id, {
                        dv, sender,
                        completedAt: new Date().toISOString(),
                    })
                }

                if (validation.confirmPhoneAction) {
                    await ConfirmPhoneAction.update(context, validation.confirmPhoneAction.id, {
                        dv, sender,
                        completedAt: new Date().toISOString(),
                    })
                }

                const { keystone } = getSchemaCtx('User')
                const token = await context.startAuthedSession({
                    item: validation.user,
                    list: keystone.lists['User'],
                    meta: {
                        source: 'gql',
                        provider: 'authenticateUserWithPhoneAndPassword',
                    },
                })

                return {
                    item: validation.user,
                    token,
                }
            },
        },
    ],
})

module.exports = {
    AuthenticateUserWithPhoneAndPasswordService,
}
