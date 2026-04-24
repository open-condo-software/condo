/**
* @typedef EncryptorOptions
* @type {{
*     appId?: string
* }}
**/

/**
 * @typedef EncryptorResult
 * @type {Record<string, unknown> | null}
 */

/**
 * @func Encryptor
 * @param data {Record<string, unknown>}
 * @param options {EncryptorOptions | undefined}
 * @returns EncryptorResult
 */

function v1 (data, options) {
    if (!options?.appId?.length) return null
    if (!data) return null
    const buf = Buffer.from(JSON.stringify(data), 'utf8')
    const keyBuf = Buffer.from(options.appId, 'utf8')
    const encryptedData = Buffer.from(buf.map((b, i) => b ^ keyBuf[i % keyBuf.length])).toString('base64')
    return { [options.appId]: `v1_${encryptedData}` }

}

/** @type {Record<string, Encryptor>} */
const VERSIONS = {
    'v1': v1,
}

/**
 * @param version {string}
 * @param data {Record<string, unknown>}
 * @param options {EncryptorOptions?}
 * @return {EncryptorResult}
 */
function encryptPushData (version, data, options = {}) {
    if (!VERSIONS[version]) return null
    try {
        return VERSIONS[version](data, options)
    } catch {
        return null
    }
}

module.exports = {
    VERSIONS,
    encryptPushData,
}