const { OrganizationEmployee } = require('./index')
const { User } = require('@condo/domains/user/utils/serverSchema')

const checkEmployeeExistency = async (context, organization, email, phone, user) => {
    const employeesByEmail = await OrganizationEmployee.getAll(context, {
        email,
        organization: { id: organization.id },
        deletedAt: null,
        isRejected: false,
    })

    if (employeesByEmail.length > 0) {
        return employeesByEmail[0]
    }

    const employeesByPhone = await OrganizationEmployee.getAll(context, {
        phone,
        organization: { id: organization.id },
        deletedAt: null,
        isRejected: false,
    })

    if (employeesByPhone.length > 0) {
        return employeesByPhone[0]
    }

    if (user && user.id) {
        const employeesByUser = await OrganizationEmployee.getAll(context, {
            user: { id: user.id },
            organization: { id: organization.id },
            deletedAt: null,
            isRejected: false,
        })

        if (employeesByUser.length > 0) {
            return employeesByEmail[0]
        }
    }
}

const checkUserExistency = async (context, email, phone) => {
    const usersByEmail = await User.getAll(context, { email })

    if (usersByEmail.length > 1) throw new Error('[error] more than one user found')

    if (usersByEmail.length === 1) {
        return usersByEmail[0]
    }

    const usersByPhone = await User.getAll(context, { phone })

    if (usersByPhone.length > 1) throw new Error('[error] more than one user found')

    if (usersByPhone.length === 1) {
        return usersByPhone[0]
    }
}

module.exports = {
    checkEmployeeExistency,
    checkUserExistency,
}