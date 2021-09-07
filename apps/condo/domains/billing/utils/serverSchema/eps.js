const https = require('https')
const epsConfig = process.env['EPS_CONFIG'] && JSON.parse(process.env['EPS_CONFIG']) || {}
const { URL } = require('url')

const ENCODING = 'utf-8'
const REQUEST_TIMEOUT = 5 // seconds

const epsHttpsRequest = async (requestId, xmlFormatted = '') => {
    const xml = xmlFormatted.replace(/\s+/g, ' ').trim()
    let { host, port, pathname, protocol } = new URL(epsConfig.host)
    if (!port) {
        port = protocol === 'http:' ? 80 : 443
    }
    const options = {
        hostname: host,
        port: port || '443',
        path: pathname,
        method: 'POST',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Date': (new Date()).toString(),
            'RqUID': requestId,
            'Signature': 'FAKE_SIGNATURE_REPLACE_TO_BICRYPT',
            'Content-Type': `text/xml; charset=${ENCODING}`,
            'Content-Length': xml.length,
            'Accept-Charset': ENCODING,
        },
    }
    return new Promise(resolve => {
        let error = null
        let resultXml = ''
        const timedOut = setTimeout(() => {
            error = `${REQUEST_TIMEOUT} seconds timeout reached`
            return resolve({ error, resultXml })
        }, REQUEST_TIMEOUT * 1000)
        const request = https.request(options, res => {
            res.on('data', data => {
                clearTimeout(timedOut)
                return resolve({ error, resultXml: data.toString() })
            })
        })
        request.on('error', requestError => {
            clearTimeout(timedOut)
            return resolve({ error: requestError, resultXml })
        })
        request.write(xml)
        request.end()
    })
}



module.exports = {
    epsHttpsRequest,
}
