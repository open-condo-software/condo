const { joinNameAndType, getGarLevel, getGarParam } = require('./helpers')

function resolveCity (cityLevel) {
    if (!cityLevel) return {}

    const gar = getGarLevel(cityLevel.gar)
    const city = gar?.area?.name || null
    let city_type = 'г'
    let city_type_full = 'город'

    let isNameFirst = false

    return {
        city,
        city_type,
        city_type_full,
        city_with_type: joinNameAndType(city, city_type, isNameFirst),
        city_fias_id: gar.guid || null,
        city_kladr_id: getGarParam(gar, 'kladrcode') || null,
    }
}

module.exports = { resolveCity }
