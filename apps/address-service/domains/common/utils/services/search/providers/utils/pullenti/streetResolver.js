const { joinNameAndType, getGarLevel, getGarParam } = require('./helpers')

function resolveStreet (streetLevel) {
    if (!streetLevel) return {}

    const gar = getGarLevel(streetLevel.gar, 'street')
    const street = gar?.area?.name || null
    let street_type = 'ул'
    let street_type_full = 'улица'

    let isNameFirst = false

    switch (gar.area?.type) {
        case 'просп':
        case 'проспект':
            street_type = 'просп'
            street_type_full = 'проспект'
    }

    return {
        street,
        street_type,
        street_type_full,
        street_with_type: joinNameAndType(street, street_type, isNameFirst),
        street_fias_id: gar.guid || null,
        street_kladr_id: getGarParam(gar, 'kladrcode') || null,
    }
}

module.exports = { resolveStreet }
