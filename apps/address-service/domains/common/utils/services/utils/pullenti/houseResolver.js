const { getGarLevel, getGarParam } = require('./helpers')

function resolveHouse (houseLevel) {
    if (!houseLevel) return {}

    const gar = getGarLevel(houseLevel.gar, 'building')
    const house = gar?.house?.num || gar?.house?.snum || null
    let house_type = 'д'
    let house_type_full = 'дом'
    let block = null
    let block_type = null
    let block_type_full = null

    switch (gar?.house?.type || gar?.house?.stype) {
        case 'construction':
            house_type = 'соор'
            house_type_full = 'сооружение'
            break
    }

    if (gar?.house?.bnum) {
        block = gar.house.bnum
        block_type = 'корп'
        block_type_full = 'корпус'
    }

    const postIndex = getGarParam(gar, 'postindex')
    const kladrCode = getGarParam(gar, 'kladrcode')
    const kadasterNumber = getGarParam(gar, 'kadasternumber')

    return {
        house: house ? String(house) : null,
        house_type,
        house_type_full,
        block: block ? String(block) : null,
        block_type,
        block_type_full,
        house_fias_id: gar?.guid || null,
        house_kladr_id: kladrCode ? String(kladrCode) : null,
        house_cadnum: kadasterNumber ? String(kadasterNumber) : null,
        postal_code: postIndex ? String(postIndex) : null,
    }
}

module.exports = { resolveHouse }
