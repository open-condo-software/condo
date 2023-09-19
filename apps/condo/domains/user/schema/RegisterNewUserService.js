const { isEmpty } = require('lodash')

const { GQLError } = require('@open-condo/keystone/errors')
const { GQLCustomSchema, getById } = require('@open-condo/keystone/schema')

const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { STAFF } = require('@condo/domains/user/constants/common')
const { ERRORS } = require('@condo/domains/user/constants/errors')
const { ConfirmPhoneAction, User, createUserAndSendLoginData } = require('@condo/domains/user/utils/serverSchema')

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

                const user = await createUserAndSendLoginData({ context, userData })

                if (action) {
                    const completedAt = new Date().toISOString()
                    await ConfirmPhoneAction.update(context, action.id, { completedAt, sender, dv: 1 })
                }

                return await getById('User', user.id)
            },
        },
    ],
})

module.exports = {
    errors: ERRORS,
    RegisterNewUserService,
}
