const crypto = require('crypto')

const conf = require('@open-condo/config')


const IS_BUILD_PHASE = conf.PHASE === 'build'
if (!IS_BUILD_PHASE && !conf.ENCRYPTION_KEY_32_CHARS) {
    throw new Error('No ENCRYPTION_KEY_32_CHARS!')
}

const ENCRYPTION_KEY_32_CHARS = conf.ENCRYPTION_KEY_32_CHARS
const ivLength = 16
const inputEncoding = 'utf8'
const outputEncoding = 'hex'
const algorithm = 'aes-256-cbc'

function encrypt (str) {
    const iv = crypto.randomBytes(ivLength)
    const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY_32_CHARS, iv)

    let encrypted = cipher.update(str, inputEncoding, outputEncoding)
    encrypted += cipher.final(outputEncoding)

    return iv.toString(outputEncoding) + ':' + encrypted
}

function decrypt (encryptedData) {
    const components = encryptedData.split(':')
    const ivFromEncryptedData = Buffer.from(components.shift(), outputEncoding)

    const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY_32_CHARS, ivFromEncryptedData)

    let decryptedData = decipher.update(components.join(':'), outputEncoding, inputEncoding)
    decryptedData += decipher.final(inputEncoding)

    return decryptedData
}

/**
 * Converts value to MD5 hash. Do not ise this for hashing sensitive data!
 * @param value
 * @returns {string}
 */
// nosemgrep: contrib.nodejsscan.crypto_node.node_md5
const md5 = (value) => crypto.createHash('md5').update(value).digest('hex')


module.exports = {
    encrypt,
    decrypt,
    md5,
}
