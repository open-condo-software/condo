const get = require('lodash/get')

/**
 * @typedef {IncomingMessage & { [query]: object, [body]: object }} TIncomingMessageWithBodyAndQuery
 */

/**
 * @typedef {string|number|boolean} TReqBodyParam
 */

/**
 * @param {TIncomingMessageWithBodyAndQuery} req
 * @param {string} param
 * @param {TReqBodyParam} [defaultValue]
 * @return {TReqBodyParam}
 */
const getReqParam = (req, param, defaultValue) => {
    const reqQuery = get(req, 'query', {})
    const reqBody = get(req, 'body', {})
    return get(reqBody, param, get(reqQuery, param, defaultValue))
}

/**
 * @param {TIncomingMessageWithBodyAndQuery} req
 * @param {string} param
 * @param {object} defaultValue
 * @return {object}
 */
const getReqJson = (req, param, defaultValue) => {
    const val = getReqParam(req, param)
    if (!val || typeof val !== 'string') return defaultValue
    try {
        return JSON.parse(val)
    } catch (e) {
        return defaultValue
    }
}

module.exports = { getReqParam, getReqJson }
