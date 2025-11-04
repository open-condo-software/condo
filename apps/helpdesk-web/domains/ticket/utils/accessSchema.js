const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')

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

module.exports = {
    getTicketFieldsMatchesResidentFieldsQuery,
}