const { isEmpty } = require('lodash')

const { STAFF } = require('@condo/domains/user/constants/common')
const { User } = require('@condo/domains/user/utils/serverSchema')

const { OrganizationEmployee } = require('./index')


const checkEmployeeExistency = async (context, organization, email, phone, user) => {
    // priority to search: by user, by phone, by email
    if (user && user.id) {
        const employeesByUser = await OrganizationEmployee.getAll(context, {
            user: { id: user.id },
            organization: { id: organization.id },
            deletedAt: null,
            isRejected: false,
            isBlocked: false,
        })

        if (employeesByUser.length > 0) {
            return employeesByUser[0]
        }
    }

    const employeesByPhone = await OrganizationEmployee.getAll(context, {
        phone,
        organization: { id: organization.id },
        deletedAt: null,
        isRejected: false,
        isBlocked: false,
    })

    if (employeesByPhone.length > 0) {
        return employeesByPhone[0]
    }

    if (!isEmpty(email)) {
        const employeesByEmail = await OrganizationEmployee.getAll(context, {
            email,
            organization: { id: organization.id },
            deletedAt: null,
            isBlocked: false,
            isRejected: false,
        })
        if (employeesByEmail.length > 0) {
            return employeesByEmail[0]
        }
    }
}

const checkStaffUserExistency = async (context, email, phone) => {
    // priority to search: by phone, by email
    const usersByPhone = await User.getAll(context, { phone, type: STAFF })
    if (usersByPhone.length > 1) throw new Error('[error] more than one user found')
    if (usersByPhone.length === 1) {
        return usersByPhone[0]
    }
    if (!isEmpty(email)) {
        const usersByEmail = await User.getAll(context, { email, type: STAFF })
        if (usersByEmail.length > 1) throw new Error('[error] more than one user found')
        if (usersByEmail.length === 1) {
            return usersByEmail[0]
        }
    }
}

module.exports = {
    checkEmployeeExistency,
    checkStaffUserExistency,
}
