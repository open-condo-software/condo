const { throwAuthenticationError } = require('@condo/keystone/apolloErrorFormatter')
const {
    queryOrganizationEmployeeFor,
    queryOrganizationEmployeeFromRelatedOrganizationFor,
} = require('@condo/domains/organization/utils/accessSchema')

async function canReadTicketOrganizationSetting ({ authentication: { item: user } }) {
    if (!user) throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    return {
        organization: {
            OR: [
                queryOrganizationEmployeeFor(user.id),
                queryOrganizationEmployeeFromRelatedOrganizationFor(user.id),
            ],
        },
    }
}

async function canUpdateTicketOrganizationSetting ({ authentication: { item: user } }) {
    if (!user) throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    return {
        organization: {
            OR: [
                queryOrganizationEmployeeFor(user.id),
                queryOrganizationEmployeeFromRelatedOrganizationFor(user.id),
            ],
        },
    }
}

module.exports = {
    canReadTicketOrganizationSetting,
    canUpdateTicketOrganizationSetting,
}
