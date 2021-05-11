const { ALREADY_EXISTS_ERROR } = require('@condo/domains/common/constants/errors')
const { findOrganizationEmployee } = require('../../../../utils/serverSchema/Organization')
const { User } = require('@condo/domains/user/utils/serverSchema')

const checkEmployeeExistency = async (context, organization, email, phone) => {
    const employeesByEmail = await findOrganizationEmployee(context, {
        email,
        organization: { id: organization.id },
    })

    if (employeesByEmail.length > 0) {
        const msg = `${ALREADY_EXISTS_ERROR}] User is already invited in the organization`
        throw new Error(msg)
    }

    const employeesByPhone = await findOrganizationEmployee(context, {
        phone,
        organization: { id: organization.id },
    })

    if (employeesByPhone.length > 0) {
        const msg = `${ALREADY_EXISTS_ERROR}] User is already invited in the organization`
        throw new Error(msg)
    }
}

const checkUserExistency = async (context, organization, email, phone) => {
    const [userByEmail] = await User.getAll(context, { email })

    if (userByEmail) {
        const msg = `${ALREADY_EXISTS_ERROR}] User is already exists`
        throw new Error(msg)
    }

    const [userByPhone] = await User.getAll(context, { phone })

    if (userByPhone) {
        const msg = `${ALREADY_EXISTS_ERROR}] User is already exists`
        throw new Error(msg)
    }
}

module.exports = {
    checkEmployeeExistency,
    checkUserExistency,
}