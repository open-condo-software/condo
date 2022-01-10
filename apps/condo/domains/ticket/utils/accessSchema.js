const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { USER_SCHEMA_NAME } = require('@condo/domains/common/constants/utils')

function checkAccessToResidentTicketActions ({ item, listKey }) {
    if (!listKey || !item) return throwAuthenticationError()
    if (item.deletedAt) return false
    if (listKey === USER_SCHEMA_NAME) {
        if (item.isAdmin) return true
        return { user: { id: item.id } }
    }
    return false
}

module.exports = { checkAccessToResidentTicketActions }