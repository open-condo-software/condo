const { isEmpty, get } = require('lodash')

function getIfOmit (result, option) {
    if (isEmpty(result) && !isEmpty(option)) {
        return option.split(':').pop()
    } else {
        return result
    }
}

function getIp (req) {
    let ip = null

    ip = getIfOmit(ip, get(req, ['headers', 'x-real-ip']))
    ip = getIfOmit(ip, get(req, ['headers', 'x-hwwaf-real-ip']))
    ip = getIfOmit(ip, get(req, ['headers', 'x-hwwaf-client-ip']))
    ip = getIfOmit(ip, get(req, ['headers', 'x-original-forwarded-for']))
    ip = getIfOmit(ip, get(req, ['headers', 'x-forwarded-for']))
    ip = getIfOmit(ip, get(req, ['ip']))

    return ip
}

module.exports = {
    getIp,
}
