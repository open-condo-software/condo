const crypto = require('crypto')

/**
 * Converts value to MD5 hash
 * @param value
 * @returns {string}
 */
const md5 = (value) => crypto.createHash('md5').update(value).digest('hex')

module.exports = {
    md5,
}