const { getGarLevel, getGarParam } = require('./helpers')

function resolveFlat (apartmentLevel) {
    if (!apartmentLevel) return {}

    const gar = getGarLevel(apartmentLevel.gar, 'apartment')
    const flat = gar?.room?.num || null
    let flat_type = 'кв'
    let flat_type_full = 'квартира'

    // Add mapping with the switch below if needed
    switch (gar.room?.type) {
        case 'apartment':
            flat_type = 'апарт'
            flat_type_full = 'апартаменты'
    }

    return {
        flat,
        flat_type,
        flat_type_full,
        flat_fias_id: gar.guid || null,
        flat_cadnum: getGarParam(gar, 'kadasternumber') || null,
    }
}

module.exports = { resolveFlat }
