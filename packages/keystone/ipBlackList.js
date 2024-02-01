const express = require('express')
const { isEmpty } = require('lodash')

const conf = require('@open-condo/config')
const { getIp } = require('@open-condo/keystone/ip.utils')

const ipBlackList = (conf.IP_BLACK_LIST || '').split(',')
    .map(ip => ip.trim())
    .filter(ip => !isEmpty(ip))
    .reduce((map, ip) => {
        map[ip] = true
        return map
    }, {})


class IpBlackListMiddleware {
    async prepareMiddleware ({ keystone }) {
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use((req, res, next) => {
            const ip = getIp(req)
            if (ipBlackList[ip]) {
                res.status(410).send('Too Many Requests')
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