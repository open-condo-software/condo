const { joinNameAndType, getGarLevel, getGarParam } = require('./helpers')

function resolveArea (districtLevel) {
    if (!districtLevel) return {}

    const gar = getGarLevel(districtLevel.gar, 'adminarea')
    const area = gar.area?.name
    let area_type = 'р-н'
    let area_type_full = 'район'

    let isNameFirst = false

    switch (gar.area?.type) {
        case 'муниципальный округ':
            area_type = 'муницип окр'
            area_type_full = 'муниципальный округ'
    }

    return {
        area,
        area_type,
        area_type_full,
        area_with_type: joinNameAndType(area, area_type, isNameFirst),
        area_fias_id: gar.guid || null,
        area_kladr_id: getGarParam(gar, 'kladrcode') || null,
    }
}

module.exports = { resolveArea }
