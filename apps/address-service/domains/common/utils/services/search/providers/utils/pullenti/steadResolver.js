const { getGarLevel, getGarParam } = require('./helpers')

function resolveStead (plotLevel) {
    if (!plotLevel) return {}

    const gar = getGarLevel(plotLevel.gar)
    const stead = gar?.stead?.pnum || null
    let stead_type = 'уч'
    let stead_type_full = 'участок'

    return {
        stead,
        stead_type,
        stead_type_full,
        stead_fias_id: gar?.guid || null,
        stead_cadnum: getGarParam(gar, 'kadasternumber') || null,
    }
}

module.exports = { resolveStead }
