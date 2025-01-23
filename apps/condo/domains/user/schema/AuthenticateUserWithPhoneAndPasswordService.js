const conf = require('@open-condo/config')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { WRONG_PHONE_FORMAT } = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { STAFF } = require('@condo/domains/user/constants/common')
const { WRONG_CREDENTIALS } = require('@condo/domains/user/constants/errors')
const { AUTH_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')
const { USER_FIELDS } = require('@condo/domains/user/gql')
const { User } = require('@condo/domains/user/utils/serverSchema')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const redisGuard = new RedisGuard()

const GUARD_DEFAULT_WINDOW_SIZE_IN_SEC = 60 * 60 // seconds
const GUARD_DEFAULT_WINDOW_LIMIT = 10

/**
 * @typedef {Object} TAuthGuardQuota
 * @property {number} windowSizeInSec The window size in seconds
 * @property {number} windowLimit Attempts limit during the window
 */

/**
 * @type {Record<string, TAuthGuardQuota>}
 *
 * Possible values:
 * 1. Change all
 * { "i.p.v.4": { windowSizeInSec: 3600, windowLimit: 60 } }
 *
 * 2. Change only window size
 * { "i.p.v.4": { windowSizeInSec: 3600 } }
 *
 * 3. Change only limit
 * { "i.p.v.4": { windowLimit: 60 } }
 */
let customQuotas
try {
    customQuotas = JSON.parse(conf.AUTH_GUARD_CUSTOM_QUOTAS)
} catch (e) {
    customQuotas = {}
}

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
}

const AuthenticateUserWithPhoneAndPasswordService = new GQLCustomSchema('AuthenticateUserWithPhoneAndPasswordService', {
    types: [
        {
            access: true,
            type: 'input AuthenticateUserWithPhoneAndPasswordInput { phone: String! password: String! }',
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
            resolver: async (parent, args, context) => {

                const ip = context.req.ip

                await redisGuard.checkCustomLimitCounters(
                    `${AUTH_COUNTER_LIMIT_TYPE}:${ip}`,
                    customQuotas[ip]?.windowSizeInSec || GUARD_DEFAULT_WINDOW_SIZE_IN_SEC,
                    customQuotas[ip]?.windowLimit || GUARD_DEFAULT_WINDOW_LIMIT,
                    context,
                )

                const { data: { phone: inputPhone, password } } = args
                const phone = normalizePhone(inputPhone)
                if (!phone) {
                    throw new GQLError(ERRORS.WRONG_PHONE_FORMAT, context)
                }
                const users = await User.getAll(context, { phone, type: STAFF, deletedAt: null }, USER_FIELDS)
                if (users.length !== 1) {
                    throw new GQLError(ERRORS.WRONG_CREDENTIALS, context)
                }
                const user = await getById('User', users[0].id)
                const { keystone } = getSchemaCtx('User')
                const { auth: { User: { password: PasswordStrategy } } } = keystone
                const list = PasswordStrategy.getList()
                const { success } = await PasswordStrategy._matchItem(user, { password }, list.fieldsByPath['password'])
                if (!success) {
                    throw new GQLError(ERRORS.WRONG_CREDENTIALS, context)
                }
                const token = await context.startAuthedSession({ item: users[0], list: keystone.lists['User'] })
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
