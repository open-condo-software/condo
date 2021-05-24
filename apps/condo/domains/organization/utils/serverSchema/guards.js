const { ALREADY_EXISTS_ERROR } = require('@condo/domains/common/constants/errors')
const { findOrganizationEmployee } = require('../../../../utils/serverSchema/Organization')
const { User } = require('@condo/domains/user/utils/serverSchema')

const checkEmployeeExistency = async (context, organization, email, phone, user) => {
    const employeesByEmail = await findOrganizationEmployee(context, {
        email,
        organization: { id: organization.id },
        deletedAt: null,
    })

    if (employeesByEmail.length > 0) {
        const msg = `${ALREADY_EXISTS_ERROR}email] User is already invited in the organization`
        throw new Error(msg)
    }

    const employeesByPhone = await findOrganizationEmployee(context, {
        phone,
        organization: { id: organization.id },
        deletedAt: null,
    })

    if (employeesByPhone.length > 0) {
        const msg = `${ALREADY_EXISTS_ERROR}phone] User is already invited in the organization`
        throw new Error(msg)
    }

    if (user && user.id) {
        const employeesByUser = await findOrganizationEmployee(context, {
            user: { id: user.id },
            organization: { id: organization.id },
            deletedAt: null,
        })

        if (employeesByUser.length > 0) {
            const msg = `${ALREADY_EXISTS_ERROR}user] User is already invited in the organization`
            throw new Error(msg)
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