const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { WRONG_PHONE_FORMAT, COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { STAFF, SERVICE } = require('@condo/domains/user/constants/common')
const { WRONG_CREDENTIALS, CAPTCHA_CHECK_FAILED } = require('@condo/domains/user/constants/errors')
const { captchaCheck } = require('@condo/domains/user/utils/hCaptcha')
const { authGuards, validateUserCredentials } = require('@condo/domains/user/utils/serverSchema/auth')


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
}

const AuthenticateUserWithPhoneAndPasswordService = new GQLCustomSchema('AuthenticateUserWithPhoneAndPasswordService', {
    types: [
        {
            access: true,
            type: 'input AuthenticateUserWithPhoneAndPasswordInput { dv: Int, sender: SenderFieldInput, captcha: String, userType: UserTypeType, phone: String! password: String! }',
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

                const { success, user } = await validateUserCredentials(
                    { phone, userType },
                    { password }
                )

                if (!success) {
                    throw new GQLError(ERRORS.WRONG_CREDENTIALS, context)
                }

                const { keystone } = getSchemaCtx('User')
                const token = await context.startAuthedSession({ item: user, list: keystone.lists['User'] })

                return {
                    item: user,
                    token,
                }
            },
        },
    ],
})

module.exports = {
    AuthenticateUserWithPhoneAndPasswordService,
}
