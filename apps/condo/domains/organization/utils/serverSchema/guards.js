const { isEmpty } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { STAFF } = require('@condo/domains/user/constants/common')
const { User } = require('@condo/domains/user/utils/serverSchema')


const checkEmployeeExistency = async (context, organization, email, phone, user) => {
    const orCondition = []
    const isNeedToCheckByUser = user && !isEmpty(user.id)
    const isNeedToCheckByPhone = !isEmpty(phone)
    const isNeedToCheckByEmail = !isEmpty(email)

    if (isNeedToCheckByUser) {
        orCondition.push({ user: { id: user.id } })
    }
    if (isNeedToCheckByPhone) {
        orCondition.push({ phone })
    }
    if (isNeedToCheckByEmail) {
        orCondition.push({ email })
    }

    const userEmployees = await find('OrganizationEmployee', {
        AND: [
            {
                organization: { id: organization.id },
                deletedAt: null,
                isBlocked: false,
                isRejected: false,
            },
            { OR: orCondition },
        ],
    })

    // priority to search: by user, by phone, by email
    if (isNeedToCheckByUser) {
        const employeesByUser = userEmployees.filter(employee => employee.user === user.id)
        if (employeesByUser.length > 0) {
            return employeesByUser[0]
        }
    }

    if (isNeedToCheckByPhone) {
        const employeesByPhone = userEmployees.filter(employee => employee.phone === phone)
        if (employeesByPhone.length > 0) {
            return employeesByPhone[0]
        }
    }

    if (isNeedToCheckByEmail) {
        const employeesByEmail = userEmployees.filter(employee => employee.email === email)
        if (employeesByEmail.length > 0) {
            return employeesByEmail[0]
        }
    }
}

const checkStaffUserExistency = async (context, email, phone) => {
    // priority to search: by phone, by email
    if (isEmpty(email) && isEmpty(phone)) {
        throw new Error('[error] both phone and email are empty')
    }

    if (!isEmpty(phone)) {
        const usersByPhone = await User.getAll(context, { phone, type: STAFF })
        if (usersByPhone.length > 1) throw new Error('[error] more than one user found')
        if (usersByPhone.length === 1) {
            return usersByPhone[0]
        }
    }

    if (!isEmpty(email)) {
        const usersByEmail = await User.getAll(context, { email, type: STAFF })
        if (usersByEmail.length > 1) throw new Error('[error] more than one user found')
        if (usersByEmail.length === 1) {
            return usersByEmail[0]
        }
    }

    return null
}

module.exports = {
    checkEmployeeExistency,
    checkStaffUserExistency,
}
