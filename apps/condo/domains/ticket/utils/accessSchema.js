const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')

function checkAccessToResidentTicketActions(user) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return true
    return {
        user: { id: user.id },
    }
}

module.exports = { checkAccessToResidentTicketActions }
