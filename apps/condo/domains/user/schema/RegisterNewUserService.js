const { isEmpty, pick } = require('lodash')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT, INTERNAL_ERROR } } = require('@open-condo/keystone/errors')
const { GQLCustomSchema, getById } = require('@open-condo/keystone/schema')

const { NOT_UNIQUE, WRONG_PHONE_FORMAT } = require('@condo/domains/common/constants/errors')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { REGISTER_NEW_USER_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { STAFF } = require('@condo/domains/user/constants/common')
const { GQL_ERRORS: USER_ERRORS } = require('@condo/domains/user/constants/errors')
const { UNABLE_TO_FIND_CONFIRM_PHONE_ACTION, UNABLE_TO_CREATE_USER } = require('@condo/domains/user/constants/errors')
const { ConfirmPhoneAction, User } = require('@condo/domains/user/utils/serverSchema')


/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const ERRORS = {
    UNABLE_TO_FIND_CONFIRM_PHONE_ACTION: {
        mutation: 'registerNewUser',
        variable: ['data', 'confirmPhoneActionToken'],
        code: BAD_USER_INPUT,
        type: UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
        message: 'Unable to find confirm phone action',
        messageForUser: 'api.user.registerNewUser.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION',
    },
    WRONG_PHONE_FORMAT: {
        mutation: 'registerNewUser',
        variable: ['data', 'phone'],
        code: BAD_USER_INPUT,
        type: WRONG_PHONE_FORMAT,
        message: 'Wrong format of provided phone number',
        messageForUser: 'api.common.WRONG_PHONE_FORMAT',
        correctExample: '+79991234567',
    },
    ...pick(USER_ERRORS, [
        'INVALID_PASSWORD_LENGTH',
        'PASSWORD_CONTAINS_EMAIL',
        'PASSWORD_CONTAINS_PHONE',
        'PASSWORD_IS_FREQUENTLY_USED',
        'PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS',
    ]),
    USER_WITH_SPECIFIED_PHONE_ALREADY_EXISTS: {
        mutation: 'registerNewUser',
        variable: ['data', 'phone'],
        code: BAD_USER_INPUT,
        type: NOT_UNIQUE,
        message: 'User with specified phone already exists',
        messageForUser: 'api.user.registerNewUser.USER_WITH_SPECIFIED_PHONE_ALREADY_EXISTS',
    },
    USER_WITH_SPECIFIED_EMAIL_ALREADY_EXISTS: {
        mutation: 'registerNewUser',
        variable: ['data', 'email'],
        code: BAD_USER_INPUT,
        type: NOT_UNIQUE,
        message: 'User with specified email already exists',
        messageForUser: 'api.user.registerNewUser.USER_WITH_SPECIFIED_EMAIL_ALREADY_EXISTS',
    },
    UNABLE_TO_CREATE_USER: {
        mutation: 'registerNewUser',
        code: INTERNAL_ERROR,
        type: UNABLE_TO_CREATE_USER,
        message: 'Unable to create user',
        messageForUser: 'api.user.registerNewUser.UNABLE_TO_CREATE_USER',
    },
}

async function ensureNotExists (context, field, value) {
    const existed = await User.getOne(context, { [field]: value, type: STAFF })
    if (existed) {
        throw new GQLError({
            phone: ERRORS.USER_WITH_SPECIFIED_PHONE_ALREADY_EXISTS,
            email: ERRORS.USER_WITH_SPECIFIED_EMAIL_ALREADY_EXISTS,
        }[field], context)
    }
}

// TODO(zuch): create registerStaffUserService, separate logic of creating employee, make confirmPhoneActionToken to be required, remove meta, args to UserInput
const RegisterNewUserService = new GQLCustomSchema('RegisterNewUserService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewUserInput { dv: Int!, sender: SenderFieldInput!, name: String!, password: String!, confirmPhoneActionToken: String!, email: String, phone: String, meta: JSON }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'registerNewUser(data: RegisterNewUserInput!): User',
            doc: {
                summary: 'Registers new user and sends notification',
                description: 'User will be registered only in case of correct provided token of phone confirmation action. After successful registration, phone confirmation action will be marked as completed and will not be allowed for further usage',
                errors: ERRORS,
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                // TODO(DOMA-3209): check dv, email, phone! and make it required
                const { dv, sender, confirmPhoneActionToken, phone, email, ...restUserData } = data
                const userData = {
                    ...restUserData,
                    email: normalizeEmail(email),
                    phone: normalizePhone(phone),
                    type: STAFF,
                    isPhoneVerified: false,
                    sender,
                    dv,
                }

                let action = null
                if (confirmPhoneActionToken) {
                    action = await ConfirmPhoneAction.getOne(context, {
                        token: confirmPhoneActionToken,
                        expiresAt_gte: new Date().toISOString(),
                        completedAt: null,
                        isPhoneVerified: true,
                    }, {
                        doesNotExistError: ERRORS.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
                    })
                    userData.phone = action.phone
                    userData.isPhoneVerified = action.isPhoneVerified
                }
                if (!normalizePhone(userData.phone)) {
                    throw new GQLError(ERRORS.WRONG_PHONE_FORMAT, context)
                }
                await ensureNotExists(context, 'phone', userData.phone)
                if (!isEmpty(userData.email)) {
                    await ensureNotExists(context, 'email', userData.email)
                }

                if (!userData.password) {
                    throw new GQLError(ERRORS.INVALID_PASSWORD_LENGTH, context)
                }

                const user = await User.create(context, userData, {
                    errorMapping: {
                        '[password:minLength:User:password]': ERRORS.INVALID_PASSWORD_LENGTH,
                        '[password:rejectCommon:User:password]': ERRORS.PASSWORD_IS_FREQUENTLY_USED,
                        [ERRORS.INVALID_PASSWORD_LENGTH.message]: ERRORS.INVALID_PASSWORD_LENGTH,
                        [ERRORS.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS.message]: ERRORS.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
                        [ERRORS.PASSWORD_CONTAINS_EMAIL.message]: ERRORS.PASSWORD_CONTAINS_EMAIL,
                        [ERRORS.PASSWORD_CONTAINS_PHONE.message]: ERRORS.PASSWORD_CONTAINS_PHONE,
                    },
                })
                if (action) {
                    const completedAt = new Date().toISOString()
                    await ConfirmPhoneAction.update(context, action.id, { completedAt, sender, dv: 1 })
                }

                await sendMessage(context, {
                    to: { user: { id: user.id } },
                    type: REGISTER_NEW_USER_MESSAGE_TYPE,
                    meta: {
                        userPassword: userData.password,
                        userPhone: userData.phone,
                        dv: 1,
                    },
                    sender,
                })

                return await getById('User', user.id)
            },
        },
    ],
})

module.exports = {
    errors: ERRORS,
    RegisterNewUserService,
}
