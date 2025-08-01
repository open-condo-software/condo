/**
 * Generated by `createschema user.User name:Text; password?:Password; isAdmin?:Checkbox; email?:Text; isEmailVerified?:Checkbox; phone?:Text; isPhoneVerified?:Checkbox; avatar?:File; meta:Json; importId:Text;`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */
const crypto = require('crypto')

const { faker } = require('@faker-js/faker')
const has = require('lodash/has')

const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const conf = require('@open-condo/config')
const { find } = require('@open-condo/keystone/schema')

const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const { SMS_CODE_LENGTH } = require('@condo/domains/user/constants/common')
const { ERRORS } = require('@condo/domains/user/constants/errors')
const { SIGNIN_AS_USER_MUTATION } = require('@condo/domains/user/gql')
const { REGISTER_NEW_SERVICE_USER_MUTATION } = require('@condo/domains/user/gql')
const { SEND_MESSAGE_TO_SUPPORT_MUTATION } = require('@condo/domains/user/gql')
const { RESET_USER_MUTATION } = require('@condo/domains/user/gql')
// nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
const { GET_ACCESS_TOKEN_BY_USER_ID_QUERY } = require('@condo/domains/user/gql')
const { CHECK_USER_EXISTENCE_MUTATION } = require('@condo/domains/user/gql')
const { GENERATE_SUDO_TOKEN_MUTATION } = require('@condo/domains/user/gql')
const { AUTHENTICATE_OR_REGISTER_USER_WITH_TOKEN_MUTATION } = require('@condo/domains/user/gql')
const { CONFIRM_EMAIL_ACTION_MUTATION } = require('@condo/domains/user/gql')
const { AUTHENTICATE_USER_WITH_EMAIL_AND_PASSWORD_MUTATION } = require('@condo/domains/user/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const User = generateServerUtils('User')
const UserExternalIdentity = generateServerUtils('UserExternalIdentity')
const ConfirmPhoneAction = generateServerUtils('ConfirmPhoneAction')
const OidcClient = generateServerUtils('OidcClient')
const ExternalTokenAccessRight = generateServerUtils('ExternalTokenAccessRight')

async function signinAsUser (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')
    if (!data.id)  throw new Error('no data.id')
    return await execGqlWithoutAccess(context, {
        query: SIGNIN_AS_USER_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to signinAsUser',
        dataPath: 'result',
    })
}

async function registerNewServiceUser (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')
    return await execGqlWithoutAccess(context, {
        query: REGISTER_NEW_SERVICE_USER_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to registerNewUserService',
        dataPath: 'result',
    })
}

async function resetUser (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: RESET_USER_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to resetUser',
        dataPath: 'result',
    })
}

async function sendMessageToSupport (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: SEND_MESSAGE_TO_SUPPORT_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to sendMessageToSupport',
        dataPath: 'result',
    })
}

async function getAccessTokenByUserId (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')

    return await execGqlWithoutAccess(context, {
        query: GET_ACCESS_TOKEN_BY_USER_ID_QUERY,
        variables: { data: { ...data } },
        errorMessage: '[error] Unable to getAccessTokenByUserId',
        dataPath: 'result',
    })
}

const UserRightsSet = generateServerUtils('UserRightsSet')
async function checkUserExistence (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: CHECK_USER_EXISTENCE_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to checkUserExistence',
        dataPath: 'obj',
    })
}

const ResetUserLimitAction = generateServerUtils('ResetUserLimitAction')
const UserSudoToken = generateServerUtils('UserSudoToken')
async function generateSudoToken (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: GENERATE_SUDO_TOKEN_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to generateSudoToken',
        dataPath: 'obj',
    })
}

async function authenticateOrRegisterUserWithToken (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: AUTHENTICATE_OR_REGISTER_USER_WITH_TOKEN_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to authenticateOrRegisterUserWithToken',
        dataPath: 'obj',
    })
}

const ConfirmEmailAction = generateServerUtils('ConfirmEmailAction')
async function confirmEmailAction (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: CONFIRM_EMAIL_ACTION_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to confirmEmailAction',
        dataPath: 'obj',
    })
}

async function authenticateUserWithEmailAndPassword (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: AUTHENTICATE_USER_WITH_EMAIL_AND_PASSWORD_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to authenticateUserWithEmailAndPassword',
        dataPath: 'obj',
    })
}

/* AUTOGENERATE MARKER <CONST> */

const whiteList = conf.SMS_WHITE_LIST ? JSON.parse(conf.SMS_WHITE_LIST) : {}


const generateSmsCode = (phone) => {
    if (has(whiteList, phone)) { // Emulate Firebase white list for development - no real send sms
        return Number(whiteList[phone])
    }
    return faker.datatype.number({
        min: Math.pow(10, SMS_CODE_LENGTH - 1), // example 6 symbols:  min = 10^(6-1) = 100000
        max: Math.pow(10, SMS_CODE_LENGTH) - 1, // max = 10^6-1 = 999999
    })
}

function generateSecureCode (length = 4) {
    if (length < 4) throw new Error('Secure code cannot be shorter then 4 characters')

    const max = 10 ** length
    const min = 10 ** (length - 1)

    const code = crypto.randomInt(min, max)
    return code.toString().padStart(length, '0')
}

const updateEmployeesRelatedToUser = async (context, user) => {
    if (!user || !user.id) throw new Error('updateEmployeesRelatedToUser(): without user.id')
    const acceptedInviteEmployees = await find('OrganizationEmployee', { user: { id: user.id }, isAccepted: true })
    const readyToUpdateEmployees = acceptedInviteEmployees.filter(employee => !employee.deletedAt)
    if (readyToUpdateEmployees.length > 0) {
        await Promise.all(readyToUpdateEmployees.map(employee => {
            OrganizationEmployee.update(context, employee.id, {
                dv: user.dv,
                sender: user.sender,
                name: user.name,
                email: user.email,
                phone: user.phone,
            })
        }))
    }
}

async function createUser ({ context, userData }) {
    return await User.create(context, userData, 'id', {
        errorMapping: {
            '[password:minLength:User:password]': ERRORS.INVALID_PASSWORD_LENGTH,
            '[password:rejectCommon:User:password]': ERRORS.PASSWORD_IS_FREQUENTLY_USED,
            [ERRORS.INVALID_PASSWORD_LENGTH.message]: ERRORS.INVALID_PASSWORD_LENGTH,
            [ERRORS.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS.message]: ERRORS.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
            [ERRORS.PASSWORD_CONTAINS_EMAIL.message]: ERRORS.PASSWORD_CONTAINS_EMAIL,
            [ERRORS.PASSWORD_CONTAINS_PHONE.message]: ERRORS.PASSWORD_CONTAINS_PHONE,
        },
    })
}

module.exports = {
    createUser,
    User,
    UserExternalIdentity,
    ConfirmPhoneAction,
    generateSmsCode,
    generateSecureCode,
    updateEmployeesRelatedToUser,
    signinAsUser,
    registerNewServiceUser,
    sendMessageToSupport,
    resetUser,
    OidcClient,
    ExternalTokenAccessRight,
    getAccessTokenByUserId,
    UserRightsSet,
    checkUserExistence,
    ResetUserLimitAction,
    UserSudoToken,
    generateSudoToken,
    authenticateOrRegisterUserWithToken,
    ConfirmEmailAction,
    confirmEmailAction,
    authenticateUserWithEmailAndPassword,
/* AUTOGENERATE MARKER <EXPORTS> */
}
