const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')

function checkAccessToResidentTicketActions ({ item: user }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    return { user: { id: user.id } }
}

module.exports = { checkAccessToResidentTicketActions }