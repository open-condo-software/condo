const passwordGenerator = require('generate-password')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { REGISTER_NEW_USER_MUTATION } = require('@condo/domains/user/gql')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { PHONE_WRONG_FORMAT_ERROR } = require('@condo/domains/common/constants/errors')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { createOrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema/Organization')
const access = require('@condo/domains/organization/access/InviteNewOrganizationEmployeeService')
const guards = require('../utils/serverSchema/guards')
const { ALREADY_EXISTS_ERROR, NOT_FOUND_ERROR } = require('@condo/domains/common/constants/errors')
const get = require('lodash/get')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { getById } = require('@core/keystone/schema')

const InviteNewOrganizationEmployeeService = new GQLCustomSchema('InviteNewOrganizationEmployeeService', {
    types: [
        {
            access: true,
            type: 'input InviteNewOrganizationEmployeeInput { dv: Int!, sender: SenderFieldInput!, organization: OrganizationWhereUniqueInput!, email: String, phone: String!, name: String, role: OrganizationEmployeeRoleWhereUniqueInput, position: String, specializations: TicketCategoryClassifierRelateToManyInput}',
        },
        {
            access: true,
            type: 'input ReInviteOrganizationEmployeeInput { dv: Int!, sender: SenderFieldInput!, organization: OrganizationWhereUniqueInput!, email: String, phone: String!}',
        },
    ],
    mutations: [
        {
            access: access.canInviteNewOrganizationEmployee,
            schema: 'inviteNewOrganizationEmployee(data: InviteNewOrganizationEmployeeInput!): OrganizationEmployee',
            resolver: async (parent, args, context) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                let { organization, email, phone, role, position, name, specializations, ...restData } = data
                phone = normalizePhone(phone)
                email = normalizeEmail(email)
                if (!phone) throw new Error(`${PHONE_WRONG_FORMAT_ERROR}phone] invalid format`)
                const userOrganization = await Organization.getOne(context, { id: organization.id })
                let user = await guards.checkStaffUserExistency(context, email, phone)
                const existedEmployee = await guards.checkEmployeeExistency(context, userOrganization, email, phone, user)

                if (existedEmployee) {
                    const msg = `${ALREADY_EXISTS_ERROR}employee unique] User is already invited in the organization`
                    throw new Error(msg)
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
                        const msg = '[error] Unable to register user'
                        throw new Error(msg)
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
            resolver: async (parent, args, context) => {
                if (!context.authedItem.id) {
                    throw new Error('[error] User is not authenticated')
                }
                const { data } = args
                let { organization, email, sender, phone } = data
                phone = normalizePhone(phone)
                email = normalizeEmail(email)
                if (!phone) {
                    throw new Error(`${PHONE_WRONG_FORMAT_ERROR}phone] invalid format`)
                }

                const [employeeOrganization] = await Organization.getAll(context, { id: organization.id })

                if (!employeeOrganization) {
                    throw new Error('No organization found for OrganizationEmployeeRole')
                }

                const existedUser = await guards.checkStaffUserExistency(context, email, phone)
                if (!existedUser) {
                    const msg = `${NOT_FOUND_ERROR}user undef] There is no user for employee`
                    throw new Error(msg)
                }

                const existedEmployee = await guards.checkEmployeeExistency(context, organization, email, phone, existedUser)
                if (!existedEmployee) {
                    const msg = `${NOT_FOUND_ERROR}employee undef] There is no employee found invited to organization`
                    throw new Error(msg)
                }

                if (get(existedEmployee, 'isAccepted')) {
                    const msg = `${ALREADY_EXISTS_ERROR}employee unique] User is already accepted organization invitation`
                    throw new Error(msg)
                }

                const organizationCountry = get(employeeOrganization, 'country', 'en')
                const organizationName = get(employeeOrganization, 'name')

                await sendMessage(context, {
                    lang: organizationCountry,
                    to: {
                        user: {
                            id: existedUser.id,
                        },
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
