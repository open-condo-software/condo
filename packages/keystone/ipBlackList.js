const express = require('express')
const { isEmpty } = require('lodash')

const conf = require('@open-condo/config')

function buildIpDictionary (ips) {
    const root = {}
    ips.forEach(ip => {
        const octets = ip.split('.')
        let currentLevel = root
        octets.forEach(octet => {
            if (!currentLevel[octet]) {
                currentLevel[octet] = {}
            }
            // nosemgrep: javascript.lang.security.audit.prototype-pollution.prototype-pollution-loop.prototype-pollution-loop
            currentLevel = currentLevel[octet]
        })
    })
    return root
}

function checkIpInDictionary (dictionary, ip) {
    const octets = ip.split('.')
    let currentLevel = dictionary
    for (let i = 0; i < octets.length; i++) {
        const octet = octets[i]
        if (!currentLevel[octet]) {
            return false
        }
        // nosemgrep: javascript.lang.security.audit.prototype-pollution.prototype-pollution-loop.prototype-pollution-loop
        currentLevel = currentLevel[octet]
    }
    return true
}

const ipBlackList = (conf.IP_BLACK_LIST || '').split(',')
    .map(ip => ip.trim())
    .filter(ip => !isEmpty(ip))
const ipDictionary = buildIpDictionary(ipBlackList)

class IpBlackListMiddleware {
    async prepareMiddleware ({ keystone }) {
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use((req, res, next) => {
            if (checkIpInDictionary(ipDictionary, req.ip)) {
                res.status(410).send('Gone')
            } else {
                next()
            }
        })
        return app
    }
}



module.exports = {
    IpBlackListMiddleware,
}