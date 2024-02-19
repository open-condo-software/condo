const { get } = require('lodash')

function getReqLoggerContext (req) {
    const reqId = get(req, 'id')
    const sessionId = get(req, 'sessionID')
    const userId = get(req, 'user.id')
    const ip = get(req, 'ip')
    const fingerprint = get(req, 'headers.cookie.userId')
    const complexity = get(req, 'complexity')
    let user
    if (userId) {
        user = {
            id: userId,
            type: get(req, 'user.type'),
            isAdmin: get(req, 'user.isAdmin'),
            isSupport: get(req, 'user.isSupport'),
        }
    }

    return { reqId, sessionId, user, ip, fingerprint, complexity }
}

module.exports = {
    getReqLoggerContext,
}
