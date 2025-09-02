const crypto = require('crypto')


/**
 * Converts value to MD5 hash. Do not ise this for hashing sensitive data!
 * @param value
 * @returns {string}
 */
// nosemgrep: contrib.nodejsscan.crypto_node.node_md5
const md5 = (value) => crypto.createHash('md5').update(value).digest('hex')

module.exports = {
    md5,
}
