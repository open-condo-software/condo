const { get, omitBy, isNil } = require('lodash')

const { normalizeQuery, normalizeVariables } = require('./normalize')
/**
 * Extracts useful data stored in request obtained by preprocessors and other plugins such as:
 * 1. req.ip - user ip address
 * 2. req.sessionID - id of current session
 * 3. req.id - unique request id
 * 4. req.user.id - id of user in case of authorized requests
 * 5. req.headers.cookie.userId - client-side fingerprint
 * 6. req.complexity - request complexity obtained by rate-limiting plugin
 * @param req - express request object
 * @returns {{
 *  complexity?: { total: number, mutations: number, queries: number, details: { queries: Record<string, number>, mutations: Record<string, number> } },
 *  ip?: string,
 *  fingerprint?: string,
 *  sessionId?: string,
 *  user?: {isSupport: boolean, id: string, isAdmin: boolean, type: string},
 *  reqId?: string
 *  }}
 */
function getReqLoggerContext (req) {
    const reqId = get(req, 'id')
    const sessionId = get(req, 'sessionID')
    const userId = get(req, 'user.id')
    const ip = get(req, 'ip')
    const fingerprint = get(req, 'headers.cookie.userId')
    const complexity = get(req, 'complexity')
    const body = get(req, 'body')
    let operationName
    let variables
    let query
    let operationId

    if (body) {
        operationName = get(body, 'operationName')
        variables = get(body, 'variables') ? normalizeVariables(body.variables) : undefined
        query = get(body, 'query') ? normalizeQuery(body.query) : undefined
        operationId = get(body, 'operationId')
    }

    let user
    if (userId) {
        user = {
            id: userId,
            type: get(req, 'user.type'),
            isAdmin: get(req, 'user.isAdmin'),
            isSupport: get(req, 'user.isSupport'),
        }
    }

    return omitBy({ reqId, sessionId, user, ip, fingerprint, complexity, operationName, variables, query, operationId }, isNil)
}

module.exports = {
    getReqLoggerContext,
}
