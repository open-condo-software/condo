const { isEmpty, get } = require('lodash')

function getIp (req) {
    let ip = get(req, ['ip'])

    if (!isEmpty(ip)) {
        return ip.trim().split(':').pop()
    }

    return ip
}

module.exports = {
    getIp,
}
