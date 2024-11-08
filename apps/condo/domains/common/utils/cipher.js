const crypto = require('crypto')

//const ALGORITHM = 'aes-256-cbc'
//const secretKey = conf.SECRET_KEY

const SEP = ':'

function _throwIfNoAlgorithmOrSecretKey (algorithm, secretKey) {
    if (!algorithm || typeof algorithm !== 'string') {
        throw new Error('algorithm as type string is required')
    }
    if (!secretKey || typeof secretKey !== 'string') {
        throw new Error('secretKey as type string is required')
    }
}

/**
 * @param {string} text
 * @param {string} algorithm
 * @param {string} secretKey
 * @returns {string}
 */
function encrypt (text, algorithm, secretKey) {
    _throwIfNoAlgorithmOrSecretKey(algorithm, secretKey)
    
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv)
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
    
    const ivHex = iv.toString('hex')
    const contentHex = encrypted.toString('hex')
    return `${ivHex}${SEP}${contentHex}`
}

/**
 * @param {string} encoded
 * @param {string} algorithm
 * @param {string} secretKey
 * @returns {string}
 */
function decrypt (encoded, algorithm, secretKey) {
    _throwIfNoAlgorithmOrSecretKey(algorithm, secretKey)
    if (!encoded) {
        return null
    }

    const [iv, content] = encoded.split(SEP)
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'))

    const decrpyted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()])

    return decrpyted.toString()
}

module.exports = {
    encrypt,
    decrypt,
}