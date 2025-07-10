const https = require('https')
const querystring = require('querystring')
const { URL } = require('url')

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

const { getLogger } = require('@open-condo/keystone/logging')

const REQUEST_TIMEOUT = 10 * 1000
const REQUEST_TIMEOUT_ERROR = '[request:timeout:expires'

const logger = getLogger('sbbol-request-api')

dayjs.extend(utc)

/**
 * @typedef SbbolRequestApiOptions
 * @property {String} accessToken
 * @property {Number} host
 * @property {String} certificate Base64 encoded certificate value, stored in `SBBOL_PFX`
 * @property {String} passphrase used for certificate, stored in `SBBOL_PFX`
 * @property {String} accessToken should be obtained either locally or from SBBOL API
 */

/**
 * @typedef SbbolRequestApiResponse
 * @property {Object} data
 * @property {String} statusCode
 */

class SbbolRequestApi {
    /**
     * @param {SbbolRequestApiOptions} options
     */
    constructor (options) {
        const { accessToken, host, port, certificate, passphrase } = options
        const { host: hostname } = new URL(host)

        // nosemgrep: problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification
        this.options = {
            hostname,
            port,
            rejectUnauthorized: false,
            requestCert: true,
            timeout: REQUEST_TIMEOUT,
            pfx: Buffer.from(certificate, 'base64'),
            passphrase,
            agent: null,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Accept': 'application/json',
                'Accept-Charset': 'UTF-8',
            },
        }
        this.accessToken = accessToken
    }

    async request ({ method, path: basePath, body = null, headers = {} }){
        return new Promise((resolve, reject) => {
            const path = method === 'GET' && body ? `${basePath}?${querystring.stringify(body)}` : basePath
            logger.info({ msg: 'request', method, path, data: body })
            const requestOptions = {
                ...this.options,
                method,
                path,
            }
            requestOptions.headers.Authorization = `Bearer ${this.accessToken}`
            Object.assign(requestOptions.headers, headers)
            const request = https.request(requestOptions, response => {
                let data = ''
                const { statusCode, headers } = response
                response.on('data', chunk => {
                    data += chunk
                })
                response.on('end', () => {
                    logger.info({ msg: 'response', method, path, status: statusCode, data: { headers, body: data } })
                    return resolve({ data, statusCode })
                })
            })
            request.on('timeout', () => {
                request.destroy()
                logger.warn({ msg: 'timeout', method, path })
                return reject(`${REQUEST_TIMEOUT_ERROR}] sbbol request failed`)
            })
            request.on('error', err => {
                logger.error({ msg: 'error', method, path, err })
                return reject(err)
            })
            if (body && method === 'POST') {
                const stringifiedBody = JSON.stringify(body)
                request.write(stringifiedBody)
            }
            request.end()
        })
    }

}

module.exports = {
    SbbolRequestApi,
}
