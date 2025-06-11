const { joinNameAndType, getGarLevel, getGarParam, selfOrFirst } = require('./helpers')

function resolveSettlement (localityLevel) {
    if (!localityLevel) return {}

    const gar = getGarLevel(localityLevel.gar, 'adminarea')
    const settlement = selfOrFirst(gar?.area?.name) || null
    let settlement_type = null
    let settlement_type_full = null

    let isNameFirst = false

    switch (gar?.area?.type) {
        case 'село':
            settlement_type = 'с'
            settlement_type_full = 'село'
            break
        case 'поселок':
            settlement_type = 'пос'
            settlement_type_full = 'поселок'
            break
        case 'деревня':
        default:
            settlement_type = 'д'
            settlement_type_full = 'деревня'
    }

    return {
        settlement,
        settlement_type,
        settlement_type_full,
        settlement_with_type: joinNameAndType(settlement, settlement_type_full, isNameFirst),
        settlement_fias_id: gar?.guid || null,
        settlement_kladr_id: getGarParam(gar, 'kladrcode') || null,
    }
}

module.exports = { resolveSettlement }
