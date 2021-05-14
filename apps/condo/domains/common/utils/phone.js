const phone = require('phone')

function normalizePhone (data) {
    if (!data) return
    if (!data.startsWith('+')) return
    const result = phone(data)
    if (result.length !== 2) return
    return result[0]
}

module.exports = {
    normalizePhone,
}
