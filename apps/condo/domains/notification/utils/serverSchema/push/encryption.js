/**
* @typedef EncryptorOptions
* @type {{
*     appId?: string
* }}
**/
/**
 * @typedef Encryptor
 * @type {(data: Record<string, unknown>, options?: EncryptorOptions) => string | null}
 */

/** @type {Encryptor} */
const v1 = (data, options) => {
    if (!options?.appId?.length) return null
    const buf = Buffer.from(JSON.stringify(data), 'utf8')
    const keyBuf = Buffer.from(options.appId, 'utf8')
    return Buffer.from(buf.map((b, i) => b ^ keyBuf[i % keyBuf.length])).toString('base64')

}

/** @type {Record<string, Encryptor>} */
const VERSIONS = {
    'v1': v1,
}

/**
 * @param version {string}
 * @param data {Record<string, unknown>}
 * @param options {EncryptorOptions?}
 * @return {string | null}
 */
function encryptPushData (version, data, options = {}) {
    if (!VERSIONS[version]) return null
    return VERSIONS[version](data, options)
}

export {
    VERSIONS,
    encryptPushData,
}