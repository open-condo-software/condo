const { GQLCustomSchema } = require('@core/keystone/schema')
const { REGISTER_NEW_USER_MESSAGE_TYPE } = require('@condo/domains/notification/constants')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { MIN_PASSWORD_LENGTH_ERROR } = require('@condo/domains/user/constants/errors')
const { MIN_PASSWORD_LENGTH } = require('@condo/domains/user/constants/common')
const { ConfirmPhoneAction } = require('@condo/domains/user/utils/serverSchema')
const isEmpty = require('lodash/isEmpty')

async function ensureNotExists (context, model, models, field, value) {
    if (isEmpty(value)) {
        throw new Error(`[error] Unable to check field ${field} uniques because the passed value is empty`)
    }
    const { errors, data } = await context.executeGraphQL({
        context: context.createContext({ skipAccessControl: true }),
        query: `
            query find($where: ${model}WhereInput!) {
              objs: all${models}(where: $where) {
                id
              }
            }
        `,
        variables: { where: { [field]: value, type: 'staff' } },
    })

    if (errors) {
        throw new Error(`[error] Unable to check field ${field} uniques`)
    }

    if (data.objs.length !== 0) {
        throw new Error(`[unique:${field}:multipleFound] ${models} with this ${field} is already exists`)
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

                if (confirmPhoneActionToken) {
                    const [action] = await ConfirmPhoneAction.getAll(context.createContext({ skipAccessControl: true }),
                        { token: confirmPhoneActionToken }
                    )
                    if (!action) {
                        throw new Error('[error] Unable to find confirm phone action')
                    }
                    const { phone, isPhoneVerified } = action
                    if (!isPhoneVerified) {
                        throw new Error('[error] Phone is not verified')
                    }
                    userData.phone = phone
                    userData.isPhoneVerified = isPhoneVerified
                }

                await ensureNotExists(context, 'User', 'Users', 'phone', userData.phone)
                await ensureNotExists(context, 'User', 'Users', 'email', userData.email)

                if (userData.password.length < MIN_PASSWORD_LENGTH) {
                    throw new Error(`${MIN_PASSWORD_LENGTH_ERROR}] Password length less then ${MIN_PASSWORD_LENGTH} character`)
                }
                const { data: createData, errors: createErrors } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation create($data: UserCreateInput!) {
                          user: createUser(data: $data) {
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
                // TODO(Dimitreee): use locale from .env
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await sendMessage(context, {
                    lang,
                    to: {
                        user: {
                            id: createData.user.id,
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
                return createData.user
            },
        },
    ],
})

module.exports = {
    RegisterNewUserService,
}
