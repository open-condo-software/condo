const { GQLCustomSchema } = require('@core/keystone/schema')
const { REGISTER_NEW_USER_MESSAGE_TYPE } = require('@condo/domains/notification/constants')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { MIN_PASSWORD_LENGTH_ERROR } = require('@condo/domains/user/constants/errors')
const { MIN_PASSWORD_LENGTH } = require('@condo/domains/user/constants/common')
const { ConfirmPhoneAction, User } = require('@condo/domains/user/utils/serverSchema')
const isEmpty = require('lodash/isEmpty')
const {
    CONFIRM_PHONE_ACTION_EXPIRED,
} = require('@condo/domains/user/constants/errors')

async function ensureNotExists (context, field, value) {
    if (isEmpty(value)) {
        throw new Error(`[error] Unable to check field ${field} uniques because the passed value is empty`)
    }
    const existed = await User.getAll(context, { [field]: value, type: 'staff' })
    if (existed.length !== 0) {
        throw new Error(`[unique:${field}:multipleFound] user with this ${field} is already exists`)
    }
}

const RegisterNewUserService = new GQLCustomSchema('RegisterNewUserService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewUserInput { dv: Int!, sender: JSON!, name: String!, email: String!, password: String!, confirmPhoneActionToken: String, phone: String, meta: JSON }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'registerNewUser(data: RegisterNewUserInput!): User',
            resolver: async (parent, args, context) => {
                const { data } = args
                const { confirmPhoneActionToken, ...restUserData } = data
                const userData = {
                    ...restUserData,
                    type: 'staff',
                    isPhoneVerified: false,
                }
                let confirmPhoneActionId = null
                if (confirmPhoneActionToken) {
                    const [action] = await ConfirmPhoneAction.getAll(context,
                        {
                            token: confirmPhoneActionToken,
                            completedAt: null,
                            isPhoneVerified: true,
                        }
                    )
                    if (!action) {
                        throw new Error(`${CONFIRM_PHONE_ACTION_EXPIRED}] Unable to find confirm phone action`)
                    }
                    confirmPhoneActionId = action.id
                    const { phone, isPhoneVerified } = action
                    userData.phone = phone
                    userData.isPhoneVerified = isPhoneVerified
                }

                await ensureNotExists(context, 'phone', userData.phone)
                await ensureNotExists(context, 'email', userData.email)

                if (userData.password.length < MIN_PASSWORD_LENGTH) {
                    throw new Error(`${MIN_PASSWORD_LENGTH_ERROR}] Password length less then ${MIN_PASSWORD_LENGTH} character`)
                }
                const user = await User.create(context, userData)
                await ConfirmPhoneAction.update(context, confirmPhoneActionId, { completedAt: new Date().toISOString() })
                // TODO(Dimitreee): use locale from .env
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await sendMessage(context, {
                    lang,
                    to: {
                        user: {
                            id: user.id,
                        },
                    },
                    type: REGISTER_NEW_USER_MESSAGE_TYPE,
                    meta: {
                        userPassword: userData.password,
                        userPhone: userData.phone,
                        dv: 1,
                    },
                    sender: data.sender,
                })
                return user
            },
        },
    ],
})

module.exports = {
    RegisterNewUserService,
}
