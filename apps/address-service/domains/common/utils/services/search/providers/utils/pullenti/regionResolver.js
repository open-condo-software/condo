const { joinNameAndType, getGarLevel, getGarParam } = require('./helpers')

function resolveRegion (regionLevel) {
    if (!regionLevel) return {}

    const gar = getGarLevel(regionLevel.gar, 'adminarea')
    const region = gar.area?.name
    let region_type = 'обл'
    let region_type_full = 'область'

    let isNameFirst = true

    switch (regionLevel.area?.type) {
        case 'край':
            region_type = 'кр'
            region_type_full = 'край'
    }

    return {
        region,
        region_type,
        region_type_full,
        region_with_type: joinNameAndType(region, region_type, isNameFirst),
        region_fias_id: gar.guid || null,
        region_kladr_id: getGarParam(gar, 'kladrcode') || null,
    }
}

module.exports = { resolveRegion }
