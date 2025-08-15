const get = require('lodash/get')

const conf = require('@open-condo/config')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT, INTERNAL_ERROR } } = require('@open-condo/keystone/errors')
const { getById, find, getByCondition } = require('@open-condo/keystone/schema')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { WRONG_FORMAT, NOT_FOUND, WRONG_PHONE_FORMAT, DV_VERSION_MISMATCH, WRONG_EMAIL_VALUE } = require('@condo/domains/common/constants/errors')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE, DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const access = require('@condo/domains/organization/access/InviteNewOrganizationEmployeeService')
const { HOLDING_TYPE } = require('@condo/domains/organization/constants/common')
const { ALREADY_ACCEPTED_INVITATION, ALREADY_INVITED_EMAIL, ALREADY_INVITED_PHONE, UNABLE_TO_REGISTER_USER } = require('@condo/domains/organization/constants/errors')
const { Organization, OrganizationEmployee, OrganizationEmployeeSpecialization, OrganizationEmployeeRequest } = require('@condo/domains/organization/utils/serverSchema')
const guards = require('@condo/domains/organization/utils/serverSchema/guards')
const { PHONE_TYPE, EMAIL_TYPE } = require('@condo/domains/user/constants/identifiers')
const { createUser } = require('@condo/domains/user/utils/serverSchema')
const { getIdentificationUserRequiredFields } = require('@condo/domains/user/utils/serverSchema/userHelpers')


const INVITE_REQUIRE_ALLOWED_FIELDS = [PHONE_TYPE, EMAIL_TYPE]
let INVITE_REQUIRED_FIELDS = conf['INVITE_REQUIRED_FIELDS'] ? JSON.parse(conf['INVITE_REQUIRED_FIELDS']) : [PHONE_TYPE]


// NOTE: backward compatibility!
// TODO(DOMA-12135): Remove deprecated INVITE_REQUIRED_FIELDS
if (conf.IDENTIFICATION_USER_REQUIRED_FIELDS !== undefined && conf.INVITE_REQUIRED_FIELDS !== undefined) {
    throw new Error('You should use IDENTIFICATION_USER_REQUIRED_FIELDS instead of INVITE_REQUIRED_FIELDS env! Variable INVITE_REQUIRED_FIELDS is deprecated!')
} else if (conf.INVITE_REQUIRED_FIELDS !== undefined) {
    console.warn('You should use IDENTIFICATION_USER_REQUIRED_FIELDS instead of INVITE_REQUIRED_FIELDS env! Variable INVITE_REQUIRED_FIELDS is deprecated!')
} else {
    const IDENTIFICATION_USER_REQUIRED_FIELDS = getIdentificationUserRequiredFields()
    INVITE_REQUIRED_FIELDS = IDENTIFICATION_USER_REQUIRED_FIELDS.staff
}


if (INVITE_REQUIRED_FIELDS.some(item => !INVITE_REQUIRE_ALLOWED_FIELDS.includes(item))) throw new Error('INVITE_REQUIRED_FIELDS must be ["phone"], ["email"] or ["phone","email"]')

const ERRORS = {
    inviteNewOrganizationEmployee: {
        ALREADY_INVITED_EMAIL: {
            mutation: 'inviteNewOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: ALREADY_INVITED_EMAIL,
            message: 'Employee with same email already invited into the organization',
            messageForUser: 'api.organization.inviteNewOrganizationEmployee.ALREADY_INVITED_EMAIL',
            variable: ['email'],
        },
        ALREADY_INVITED_PHONE: {
            mutation: 'inviteNewOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: ALREADY_INVITED_PHONE,
            message: 'Employee with same phone already invited into the organization',
            messageForUser: 'api.organization.inviteNewOrganizationEmployee.ALREADY_INVITED_PHONE',
            variable: ['phone'],
        },
        WRONG_PHONE_FORMAT: {
            mutation: 'inviteNewOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: WRONG_PHONE_FORMAT,
            message: 'Wrong phone format',
            messageForUser: 'api.common.WRONG_PHONE_FORMAT',
        },
        WRONG_EMAIL_FORMAT: {
            mutation: 'inviteNewOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: WRONG_EMAIL_VALUE,
            message: 'Wrong email value',
            messageForUser: 'api.common.INVALID_EMAIL_FORMAT',
        },
        UNABLE_TO_REGISTER_USER: {
            mutation: 'inviteNewOrganizationEmployee',
            code: INTERNAL_ERROR,
            type: UNABLE_TO_REGISTER_USER,
            message: 'Unable to register user',
            messageForUser: 'api.organization.inviteNewOrganizationEmployee.UNABLE_TO_REGISTER_USER',
        },
        DV_VERSION_MISMATCH: {
            mutation: 'inviteNewOrganizationEmployee',
            variable: ['data', 'dv'],
            code: BAD_USER_INPUT,
            type: DV_VERSION_MISMATCH,
            message: 'Wrong value for data version number',
        },
    },
    reInviteOrganizationEmployee: {
        WRONG_PHONE_FORMAT: {
            mutation: 'reInviteOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: WRONG_FORMAT,
            message: 'Wrong phone format',
            messageForUser: 'api.common.WRONG_PHONE_FORMAT',
        },
        WRONG_EMAIL_FORMAT: {
            mutation: 'reInviteNewOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: WRONG_EMAIL_VALUE,
            message: 'Wrong email value',
            messageForUser: 'api.common.INVALID_EMAIL_FORMAT',
        },
        ORGANIZATION_NOT_FOUND: {
            mutation: 'reInviteOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: NOT_FOUND,
            message: 'Could not find Organization by specified search criteria',
            messageForUser: 'api.organization.reInviteOrganizationEmployee.ORGANIZATION_NOT_FOUND',
        },
        USER_NOT_FOUND: {
            mutation: 'reInviteOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: NOT_FOUND,
            message: 'Could not find User by specified phone or email',
            messageForUser: 'api.organization.reInviteOrganizationEmployee.USER_NOT_FOUND',
        },
        EMPLOYEE_NOT_FOUND: {
            mutation: 'reInviteOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: NOT_FOUND,
            message: 'Could not find OrganizationEmployee that has not accepted invitation for found User',
            messageForUser: 'api.organization.reInviteOrganizationEmployee.EMPLOYEE_NOT_FOUND',
        },
        ALREADY_ACCEPTED_INVITATION: {
            mutation: 'reInviteOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: ALREADY_ACCEPTED_INVITATION,
            message: 'Corresponding OrganizationEmployee has already accepted invitation',
            messageForUser: 'api.organization.reInviteOrganizationEmployee.ALREADY_ACCEPTED_INVITATION',
        },
    },
}

const InviteNewOrganizationEmployeeService = new GQLCustomSchema('InviteNewOrganizationEmployeeService', {
    types: [
        {
            access: true,
            type: 'input InviteNewOrganizationEmployeeInput { dv: Int!, sender: SenderFieldInput!, organization: OrganizationWhereUniqueInput!, email: String, phone: String, name: String, role: OrganizationEmployeeRoleWhereUniqueInput!, position: String, specializations: [TicketCategoryClassifierWhereUniqueInput], hasAllSpecializations: Boolean }',
        },
        {
            access: true,
            type: 'input ReInviteOrganizationEmployeeInput { dv: Int!, sender: SenderFieldInput!, organization: OrganizationWhereUniqueInput!, email: String, phone: String }',
        },
    ],
    mutations: [
        {
            access: access.canInviteNewOrganizationEmployee,
            schema: 'inviteNewOrganizationEmployee(data: InviteNewOrganizationEmployeeInput!): OrganizationEmployee',
            doc: {
                summary: 'Invites staff-user into specified Organization',
                description: [
                    'For corresponding User record it creates a new OrganizationEmployee and sends message with notification about invitation',
                    'It tries to find already existing User with type "staff" first by phone, then by email.',
                    'If User is not found, it will be registered.',
                ].join('\n'),
                errors: ERRORS.inviteNewOrganizationEmployee,
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                let { organization, email, phone, role, position, name, specializations = [], hasAllSpecializations, ...restData } = data
                const dvSenderData = { dv: restData.dv, sender: restData.sender }

                phone = normalizePhone(phone)
                email = normalizeEmail(email)
                if (dvSenderData.dv !== 1) throw new GQLError(ERRORS.inviteNewOrganizationEmployee.DV_VERSION_MISMATCH, context)

                const hasPhone = Boolean(phone)
                const hasEmail = Boolean(email)

                if (INVITE_REQUIRED_FIELDS.includes(PHONE_TYPE) && !hasPhone) {
                    throw new GQLError(ERRORS.inviteNewOrganizationEmployee.WRONG_PHONE_FORMAT, context)
                }

                if (INVITE_REQUIRED_FIELDS.includes(EMAIL_TYPE) && !hasEmail) {
                    throw new GQLError(ERRORS.inviteNewOrganizationEmployee.WRONG_EMAIL_FORMAT, context)
                }

                const userOrganization = await Organization.getOne(
                    context,
                    { id: organization.id },
                    'id name country type'
                )
                let user = await guards.checkStaffUserExistency(context, email, phone)
                const shouldRegisterUser = !user

                const sameOrganizationEmployees = await find('OrganizationEmployee', {
                    deletedAt: null,
                    organization: { id: userOrganization.id },
                    OR: [
                        phone && { phone },
                        phone && { user: { phone } },
                        email && { email },
                        email && { user: { email } },
                    ].filter(Boolean),
                })

                if (sameOrganizationEmployees.length > 0) {
                    const sameEmployee = sameOrganizationEmployees[0]

                    if (sameEmployee.phone === phone) {
                        throw new GQLError(ERRORS.inviteNewOrganizationEmployee.ALREADY_INVITED_PHONE, context)
                    }
                    if (sameEmployee.email === email) {
                        throw new GQLError(ERRORS.inviteNewOrganizationEmployee.ALREADY_INVITED_EMAIL, context)
                    }

                    if (sameEmployee.user) {
                        const userWithSameData = await getById('User', sameEmployee.user)

                        if (userWithSameData.phone === phone) {
                            throw new GQLError(ERRORS.inviteNewOrganizationEmployee.ALREADY_INVITED_PHONE, context)
                        }
                        if (userWithSameData.email === email) {
                            throw new GQLError(ERRORS.inviteNewOrganizationEmployee.ALREADY_INVITED_EMAIL, context)
                        }
                    }
                }

                if (shouldRegisterUser) {
                    const userData = {
                        name,
                        email,
                        phone,
                        ...dvSenderData,
                    }

                    user = await createUser({ context, userData })
                }

                const notProcessedEmployeeRequest = await getByCondition('OrganizationEmployeeRequest', {
                    user: { id: user.id, deletedAt: null },
                    organization: { id: userOrganization.id, deletedAt: null },
                    deletedAt: null,
                    isAccepted: false,
                    isRejected: false,
                })

                const employee = await OrganizationEmployee.create(context, {
                    user: { connect: { id: user.id } },
                    organization: { connect: { id: userOrganization.id } },
                    role: { connect: { id: role.id } },
                    position,
                    email,
                    name,
                    phone,
                    hasAllSpecializations,
                    ...dvSenderData,
                    // NOTE: If a user has submitted a request to join
                    // and the organization sends an invitation to that user,
                    // we consider the user to have accepted the invitation and the organization to have accepted the request
                    ...(notProcessedEmployeeRequest ? { isAccepted: true, isRejected: false } : null),
                })

                for (const specializationIdObj of specializations) {
                    await OrganizationEmployeeSpecialization.create(context, {
                        employee: { connect: { id: employee.id } },
                        specialization: { connect: specializationIdObj },
                        ...dvSenderData,
                    })
                }

                if (notProcessedEmployeeRequest) {
                    // NOTE: If a user has submitted a request to join
                    // and the organization sends an invitation to that user,
                    // we consider the user to have accepted the invitation and the organization to have accepted the request
                    await OrganizationEmployeeRequest.update(context, notProcessedEmployeeRequest.id, {
                        isAccepted: true,
                        isRejected: false,
                        createdEmployee: { connect: { id: employee.id } },
                        ...dvSenderData,
                    })
                }

                const isHolding = userOrganization.type === HOLDING_TYPE
                const organizationCountry = get(userOrganization, 'country', 'en')
                const organizationName = get(userOrganization, 'name')
                const organizationId = get(userOrganization, 'id')
                const type = !email ? DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE : DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE
                const serverUrl = isHolding && get(conf, 'CALLCENTER_DOMAIN') ? conf['CALLCENTER_DOMAIN'] : conf['SERVER_URL']

                // TODO(DOMA-11040): get locale for sendMessage from user
                await sendMessage(context, {
                    lang: organizationCountry,
                    to: {
                        user: { id: user.id },
                        phone: !email ? phone : undefined,
                        email,
                    },
                    type,
                    meta: {
                        serverUrl,
                        organizationName,
                        isRegistration: shouldRegisterUser,
                        dv: 1,
                    },
                    sender: data.sender,
                    organization: { id: organizationId },
                })

                return await getById('OrganizationEmployee', employee.id)
            },
        },
        {
            access: access.canInviteNewOrganizationEmployee,
            schema: 'reInviteOrganizationEmployee(data: ReInviteOrganizationEmployeeInput!): OrganizationEmployee',
            doc: {
                summary: 'Tries to send notification message again to already invited user',
                errors: ERRORS.reInviteOrganizationEmployee,
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                let { organization, email, sender, phone } = data
                phone = normalizePhone(phone)
                email = normalizeEmail(email)

                const hasPhone = Boolean(phone)
                const hasEmail = Boolean(email)

                if (INVITE_REQUIRED_FIELDS.includes(PHONE_TYPE) && !hasPhone) {
                    throw new GQLError(ERRORS.reInviteOrganizationEmployee.WRONG_PHONE_FORMAT, context)
                }

                if (INVITE_REQUIRED_FIELDS.includes(EMAIL_TYPE) && !hasEmail) {
                    throw new GQLError(ERRORS.reInviteOrganizationEmployee.WRONG_EMAIL_FORMAT, context)
                }

                const employeeOrganization = await Organization.getOne(
                    context,
                    { id: organization.id },
                    'id name country type'
                )

                if (!employeeOrganization) {
                    throw new GQLError(ERRORS.reInviteOrganizationEmployee.ORGANIZATION_NOT_FOUND, context)
                }

                const existedUser = await guards.checkStaffUserExistency(context, email, phone)
                if (!existedUser) {
                    throw new GQLError(ERRORS.reInviteOrganizationEmployee.USER_NOT_FOUND, context)
                }

                const existedEmployee = await guards.checkEmployeeExistency(context, organization, email, phone, existedUser)
                if (!existedEmployee) {
                    throw new GQLError(ERRORS.reInviteOrganizationEmployee.EMPLOYEE_NOT_FOUND, context)
                }

                if (get(existedEmployee, 'isAccepted')) {
                    throw new GQLError(ERRORS.reInviteOrganizationEmployee.ALREADY_ACCEPTED_INVITATION, context)
                }

                const organizationCountry = get(employeeOrganization, 'country', 'en')
                const organizationName = get(employeeOrganization, 'name')
                const organizationId = get(employeeOrganization, 'id')
                const type = !email ? DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE : DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE
                const serverUrl = employeeOrganization.type === HOLDING_TYPE && get(conf, 'CALLCENTER_DOMAIN') ? conf['CALLCENTER_DOMAIN'] : conf['SERVER_URL']

                // TODO(DOMA-11040): get locale for sendMessage from user
                await sendMessage(context, {
                    lang: organizationCountry,
                    to: {
                        user: { id: existedUser.id },
                        phone: !email ? phone : undefined,
                        email,
                    },
                    type,
                    meta: {
                        serverUrl,
                        organizationName,
                        isRegistration: false,
                        dv: 1,
                    },
                    sender: sender,
                    organization: { id: organizationId },
                })

                return await getById('OrganizationEmployee', existedEmployee.id)
            },
        },
    ],
})

module.exports = {
    InviteNewOrganizationEmployeeService,
}
