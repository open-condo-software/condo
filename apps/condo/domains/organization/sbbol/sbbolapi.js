const https = require('https')
const querystring = require('querystring')
const { URL } = require('url')
const conf = process.env
const SBBOL_CONFIG = conf.SBBOL_CONFIG ? JSON.parse(conf.SBBOL_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

const REQUEST_TIMEOUT = 10 * 1000
const REQUEST_TIMEOUT_ERROR = '[request:timeout:expires'


class SbbolRequestApi {
    constructor (accessToken) {
        const { protected_host: hostname, port } = SBBOL_CONFIG
        let { host } = new URL(hostname)
        this.options = {
            hostname: host,
            port,
            rejectUnauthorized: false,
            requestCert: true,
            timeout: REQUEST_TIMEOUT,
            pfx: Buffer.from(SBBOL_PFX.certificate, 'base64'),
            passphrase: SBBOL_PFX.passphrase,
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
    async request ({ method, path, authToken, body = null }){
        return new Promise((resolve, reject) => {
            const requestOptions = { ...this.options, ...{
                method,
                path: method === 'GET' && body ? `${path}?${querystring.stringify(body)}` : path,
            } }
            requestOptions.headers.Authorization = `Bearer ${this.accessToken}`
            const request = https.request(requestOptions, response => {
                let answer = ''
                response.on('data', data => {
                    answer += data
                })
                response.on('end', () => {
                    return resolve(answer)
                })
            })
            request.on('timeout', () => {
                request.destroy()
                return reject(`${REQUEST_TIMEOUT_ERROR}] sbbol request failed`)
            })
            request.on('error', error => {
                return reject(error)
            })
            if (body && method === 'POST') {
                request.write(querystring.stringify(body))
            }
            request.end()
        })
    }

}

module.exports = {
    SbbolRequestApi,
}