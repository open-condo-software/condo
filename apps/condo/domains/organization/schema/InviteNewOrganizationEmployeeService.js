const passwordGenerator = require('generate-password')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { REGISTER_NEW_USER_MUTATION } = require('@condo/domains/user/gql')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { createOrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema/Organization')
const access = require('@condo/domains/organization/access/InviteNewOrganizationEmployeeService')
const guards = require('../utils/serverSchema/guards')
const get = require('lodash/get')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { getById } = require('@core/keystone/schema')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT, INTERNAL_ERROR } } = require('@core/keystone/errors')
const { WRONG_FORMAT, NOT_FOUND, WRONG_PHONE_FORMAT } = require('@condo/domains/common/constants/errors')
const { ALREADY_ACCEPTED_INVITATION, ALREADY_INVITED, UNABLE_TO_REGISTER_USER } = require('../constants/errors')

const errors = {
    inviteNewOrganizationEmployee: {
        ALREADY_INVITED: {
            mutation: 'inviteNewOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: ALREADY_INVITED,
            message: 'Already invited into the organization',
            messageForUser: 'api.organization.inviteNewOrganizationEmployee.ALREADY_INVITED',
        },
        WRONG_PHONE_FORMAT: {
            mutation: 'inviteNewOrganizationEmployee',
            code: BAD_USER_INPUT,
            type: WRONG_PHONE_FORMAT,
            message: 'Wrong phone format',
            messageForUser: 'api.common.WRONG_PHONE_FORMAT',
        },
        UNABLE_TO_REGISTER_USER: {
            mutation: 'inviteNewOrganizationEmployee',
            code: INTERNAL_ERROR,
            type: UNABLE_TO_REGISTER_USER,
            message: 'Unable to register user',
            messageForUser: 'api.organization.inviteNewOrganizationEmployee.UNABLE_TO_REGISTER_USER',
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
            type: 'input InviteNewOrganizationEmployeeInput { dv: Int!, sender: SenderFieldInput!, organization: OrganizationWhereUniqueInput!, email: String, phone: String!, name: String, role: OrganizationEmployeeRoleWhereUniqueInput, position: String, specializations: TicketCategoryClassifierRelateToManyInput }',
        },
        {
            access: true,
            type: 'input ReInviteOrganizationEmployeeInput { dv: Int!, sender: SenderFieldInput!, organization: OrganizationWhereUniqueInput!, email: String, phone: String! }',
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
                errors: errors.inviteNewOrganizationEmployee,
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                let { organization, email, phone, role, position, name, specializations, ...restData } = data
                phone = normalizePhone(phone)
                email = normalizeEmail(email)
                if (!phone) throw new GQLError(errors.inviteNewOrganizationEmployee.WRONG_PHONE_FORMAT, context)
                const userOrganization = await Organization.getOne(context, { id: organization.id })
                let user = await guards.checkStaffUserExistency(context, email, phone)
                const existedEmployee = await guards.checkEmployeeExistency(context, userOrganization, email, phone, user)

                if (existedEmployee) {
                    throw new GQLError(errors.inviteNewOrganizationEmployee.ALREADY_INVITED, context)
                }

                if (!user) {
                    const password = passwordGenerator.generate({
                        length: 8,
                        numbers: true,
                    })
                    const userAttributes = {
                        name,
                        email,
                        phone,
                        password,
                        ...restData,
                    }

                    const { data: registerData, errors: registerErrors } = await context.executeGraphQL({
                        query: REGISTER_NEW_USER_MUTATION,
                        variables: {
                            data: userAttributes,
                        },
                    })

                    if (registerErrors) {
                        throw new GQLError({ ...errors.UNABLE_TO_REGISTER_USER, data: { registerErrors } }, context)
                    }

                    user = registerData.user
                }

                const employee = await createOrganizationEmployee(context, {
                    user: { connect: { id: user.id } },
                    organization: { connect: { id: userOrganization.id } },
                    ...role && { role: { connect: { id: role.id } } },
                    position,
                    email,
                    name,
                    phone,
                    specializations,
                    ...restData,
                })

                const organizationCountry = get(userOrganization, 'country', 'en')
                const organizationName = get(userOrganization, 'name')

                await sendMessage(context, {
                    lang: organizationCountry,
                    to: {
                        user: {
                            id: user.id,
                        },
                        phone: !email ? phone : undefined,
                        email,
                    },
                    type: DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE,
                    meta: {
                        organizationName,
                        dv: 1,
                    },
                    sender: data.sender,
                })

                return await getById('OrganizationEmployee', employee.id)
            },
        },
        {
            access: access.canInviteNewOrganizationEmployee,
            schema: 'reInviteOrganizationEmployee(data: ReInviteOrganizationEmployeeInput!): OrganizationEmployee',
            doc: {
                summary: 'Tries to send notification message again to already invited user',
                errors: errors.reInviteOrganizationEmployee,
            },
            resolver: async (parent, args, context) => {
                const { data } = args
                let { organization, email, sender, phone } = data
                phone = normalizePhone(phone)
                email = normalizeEmail(email)
                if (!phone) {
                    throw new GQLError(errors.reInviteOrganizationEmployee.WRONG_PHONE_FORMAT, context)
                }

                const employeeOrganization = await Organization.getOne(context, { id: organization.id })

                if (!employeeOrganization) {
                    throw new GQLError(errors.reInviteOrganizationEmployee.ORGANIZATION_NOT_FOUND, context)
                }

                const existedUser = await guards.checkStaffUserExistency(context, email, phone)
                if (!existedUser) {
                    throw new GQLError(errors.reInviteOrganizationEmployee.USER_NOT_FOUND, context)
                }

                const existedEmployee = await guards.checkEmployeeExistency(context, organization, email, phone, existedUser)
                if (!existedEmployee) {
                    throw new GQLError(errors.reInviteOrganizationEmployee.EMPLOYEE_NOT_FOUND, context)
                }

                if (get(existedEmployee, 'isAccepted')) {
                    throw new GQLError(errors.reInviteOrganizationEmployee.ALREADY_ACCEPTED_INVITATION, context)
                }

                const organizationCountry = get(employeeOrganization, 'country', 'en')
                const organizationName = get(employeeOrganization, 'name')

                await sendMessage(context, {
                    lang: organizationCountry,
                    to: {
                        user: {
                            id: existedUser.id,
                        },
                        phone: !email ? phone : undefined,
                        email,
                    },
                    type: DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE,
                    meta: {
                        organizationName,
                        dv: 1,
                    },
                    sender: sender,
                })

                return await getById('OrganizationEmployee', existedEmployee.id)
            },
        },
    ],
})

module.exports = {
    InviteNewOrganizationEmployeeService,
}
