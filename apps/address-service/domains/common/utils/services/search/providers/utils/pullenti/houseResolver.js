const { getGarLevel, getGarParam } = require('./helpers')

function resolveHouse (houseLevel) {
    if (!houseLevel) return {}

    const gar = getGarLevel(houseLevel.gar, 'building')
    const house = gar.house?.num
    let house_type = 'д'
    let house_type_full = 'дом'
    let block = null
    let block_type = null
    let block_type_full = null

    // Add mapping with the switch below if needed
    // switch (houseLevel.house?.type) {}

    if (gar.house?.bnum) {
        block = gar.house.bnum
        block_type = 'корп'
        block_type_full = 'корпус'
    }

    return {
        house: String(house),
        house_type,
        house_type_full,
        block: String(block),
        block_type,
        block_type_full,
        house_fias_id: gar.guid || null,
        house_kladr_id: getGarParam(gar, 'kladrcode') || null,
        house_cadnum: getGarParam(gar, 'kadasternumber') || null,
        postal_code: getGarParam(gar, 'postindex') || null,
    }
}

module.exports = { resolveHouse }
