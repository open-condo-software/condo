const nodeFetch = require('node-fetch')

const { getExecutionContext } = require('./executionContext')
const { getLogger } = require('./logging')
const Mertrics = require('./metrics')

const logger = getLogger('fetch')

const FETCH_COUNT_METRIC_NAME = 'fetch.count'
const FETCH_TIME_METRIC_NAME = 'fetch.time'

async function fetch (url, options, extraAttrs = {}) {

    const { skipSettingHeaders } = extraAttrs

    const urlObject = new URL(url)
    const hostname = urlObject.hostname
    const path = urlObject.pathname

    const executionContext = getExecutionContext()
    const parentReqId = executionContext.reqId
    const parentTaskId = executionContext.taskId

    // We want to set special headers to track requests across the microservices:
    // Client --reqId-> Condo --reqId-> AddressService
    //                    ^                   ^
    //                    |                   |
    //               log reqId           log reqId
    //
    if (!skipSettingHeaders) {
        if (!options.headers) {
            options.headers = {}
        }

        options.headers['X-Request-Id'] = parentReqId || parentTaskId
        options.headers['reqId'] = parentReqId
        options.headers['taskId'] = parentTaskId
    }

    const startTime = Date.now()

    try {
        const response = await nodeFetch(url, options)

        const endTime = Date.now()
        const elapsedTime = endTime - startTime

        logger.info({ msg: 'fetch: request successful', url, reqId: parentReqId, taskId: parentTaskId, path, hostname, status: response.status, elapsedTime })

        Mertrics.increment({ name: FETCH_COUNT_METRIC_NAME, value: 1, tags: { status: response.status, hostname, path } })
        Mertrics.gauge({ name: FETCH_TIME_METRIC_NAME, value: elapsedTime, tags: { status: response.status, hostname, path } })

        return response
    } catch (error) {
        const endTime = Date.now()
        const elapsedTime = endTime - startTime

        logger.error({ msg: 'fetch: failed with error', url, path, hostname, reqId: parentReqId, taskId: parentTaskId, error, elapsedTime })

        Mertrics.increment({ name: FETCH_COUNT_METRIC_NAME, value: 1, tags: { status: 'failed', hostname, path } })
        Mertrics.gauge({ name: FETCH_TIME_METRIC_NAME, value: elapsedTime, tags: { status: 'failed', hostname, path } })

        throw error
    }
}

module.exports = {
    fetch,
}