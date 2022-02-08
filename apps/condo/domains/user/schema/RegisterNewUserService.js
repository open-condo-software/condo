const { GQLCustomSchema, getById } = require('@core/keystone/schema')
const { REGISTER_NEW_USER_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { MIN_PASSWORD_LENGTH } = require('@condo/domains/user/constants/common')
const { ConfirmPhoneAction: ConfirmPhoneActionServerUtils, User: UserServerUtils } = require('@condo/domains/user/utils/serverSchema')
const { STAFF } = require('@condo/domains/user/constants/common')
const { isEmpty } = require('lodash')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { BAD_USER_INPUT, NOT_FOUND, GraphQLError } = require('@core/keystone/errors')

async function ensureNotExists (context, field, value) {
    const existed = await UserServerUtils.getAll(context, { [field]: value, type: STAFF })
    if (existed.length !== 0) {
        throw new Error(`[unique:${field}:multipleFound] user with this ${field} is already exists`)
    }
}

/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const errors = {
    UNABLE_TO_FIND_CONFIRM_PHONE_ACTION: {
        mutation: 'registerNewUser',
        variable: ['data', 'confirmPhoneActionToken'],
        code: NOT_FOUND,
        message: 'Unable to find confirm phone action',
    },
    WRONG_PHONE_FORMAT: {
        mutation: 'registerNewUser',
        variable: ['data', 'phone'],
        code: BAD_USER_INPUT,
        message: 'Wrong format of provided phone number',
        correctExample: '+79991234567',
    },
    MIN_PASSWORD_LENGTH: {
        mutation: 'registerNewUser',
        variable: ['data', 'password'],
        code: BAD_USER_INPUT,
        message: `Password length is less then ${MIN_PASSWORD_LENGTH} character`,
    },
}

// TODO(zuch): create registerStaffUserService, separate logic of creating employee, make confirmPhoneActionToken to be required, remove meta, args to UserInput
const RegisterNewUserService = new GQLCustomSchema('RegisterNewUserService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewUserInput { dv: Int!, sender: SenderFieldInput!, name: String!, email: String, password: String!, confirmPhoneActionToken: String, phone: String, meta: JSON }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'registerNewUser(data: RegisterNewUserInput!): User',
            doc: {
                summary: 'Registers new user and sends notification',
                description: 'User will be registered only in case of correct provided token of phone confirmation action. After successful registration, phone confirmation action will be marked as completed and will not be allowed for further usage',
                errors,
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                const { confirmPhoneActionToken, ...restUserData } = data
                const userData = {
                    ...restUserData,
                    type: STAFF,
                    isPhoneVerified: false,
                }
                let confirmPhoneActionId = null
                if (confirmPhoneActionToken) {
                    const [action] = await ConfirmPhoneActionServerUtils.getAll(context,
                        {
                            token: confirmPhoneActionToken,
                            completedAt: null,
                            isPhoneVerified: true,
                        }
                    )
                    if (!action) {
                        throw new GraphQLError(errors.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION)
                    }
                    confirmPhoneActionId = action.id
                    const { phone, isPhoneVerified } = action
                    userData.phone = phone
                    userData.isPhoneVerified = isPhoneVerified
                }
                if (!normalizePhone(userData.phone)) {
                    throw new GraphQLError(errors.WRONG_PHONE_FORMAT)
                }
                await ensureNotExists(context, 'phone', userData.phone)
                if (!isEmpty(userData.email)) {
                    await ensureNotExists(context, 'email', userData.email)
                }

                if (userData.password.length < MIN_PASSWORD_LENGTH) {
                    throw new GraphQLError(errors.MIN_PASSWORD_LENGTH)
                }
                // TODO(zuch): fix bug when user can not be created because of createAt and updatedAt fields
                // const user = await UserServerUtils.create(context, userData)
                const { data: { result: user }, errors: createErrors } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation create($data: UserCreateInput!) {
                          result: createUser(data: $data) {
                            id
                            name
                            email
                            isAdmin
                            isActive
                          }
                        }
                    `,
                    variables: { data: userData },
                })
                if (createErrors) {
                    const msg = '[error] Unable to create user'
                    throw new Error(msg)
                }
                // end of TODO
                if (confirmPhoneActionToken) {
                    await ConfirmPhoneActionServerUtils.update(context, confirmPhoneActionId, { completedAt: new Date().toISOString() })
                }
                const sendChannels = [{
                    to: { phone: userData.phone },
                }]
                if (!isEmpty(userData.email)) {
                    sendChannels.push({
                        to: { email: userData.email },
                    })
                }
                // TODO(Dimitreee): use locale from .env
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await Promise.all(sendChannels.map(async channel => {
                    await sendMessage(context, {
                        lang,
                        to: {
                            user: {
                                id: user.id,
                            },
                            ...channel.to,
                        },
                        type: REGISTER_NEW_USER_MESSAGE_TYPE,
                        meta: {
                            userPassword: userData.password,
                            userPhone: userData.phone,
                            dv: 1,
                        },
                        sender: data.sender,
                    })
                }))
                return await getById('User', user.id)
            },
        },
    ],
})

module.exports = {
    RegisterNewUserService,
}
