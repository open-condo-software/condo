const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')

function checkAccessToResidentTicketActions ({ item: user }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    return { user: { id: user.id } }
}

function getTicketFieldsMatchesResidentFieldsQuery (residentUser, residents) {
    return residents.map(resident =>
        ({
            AND: [
                { canReadByResident: true },
                { contact: { phone: residentUser.phone } },
                { property: { id: resident.property } },
                { unitName: resident.unitName },
                { unitType: resident.unitType || FLAT_UNIT_TYPE },
            ],
        })
    )
}

module.exports = { checkAccessToResidentTicketActions, getTicketFieldsMatchesResidentFieldsQuery }