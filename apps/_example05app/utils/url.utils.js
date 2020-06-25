const qs = require('qs')

function getQueryParams () {
    if (typeof global === 'undefined' || !global.location) return {}
    let startIndex = global.location.href.indexOf('?')
    let endIndex = global.location.href.indexOf('#')
    if (startIndex === -1) return {}
    if (endIndex === -1) endIndex = global.location.href.length
    return qs.parse(global.location.href.substring(startIndex + 1, endIndex))
}

module.exports = {
    getQueryParams,
}
