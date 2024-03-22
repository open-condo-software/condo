const nodeFetch = require('node-fetch')

const { getExecutionContext } = require('./executionContext')
const { getLogger } = require('./logging')
const Mertrics = require('./metrics')

const logger = getLogger('fetch')

async function fetch (url, options) {

    const urlObject = new URL(url)
    const host = urlObject.hostname
    const path = urlObject.pathname
    const metricUrl = host.replace(/[^a-zA-Z0-9]/g, '')

    const executionContext = getExecutionContext()
    const parentReqId = executionContext.reqId

    const startTime = Date.now()

    try {
        const response = await nodeFetch(url, options)

        const endTime = Date.now()
        const elapsedTime = endTime - startTime

        logger.info({ msg: 'fetch: request successful', url, reqId: parentReqId, path, host, status: response.status, elapsedTime })
        Mertrics.increment({ name: 'fetch.status.' + metricUrl, value: response.status, tags: { path } })
        Mertrics.gauge({ name: 'fetch.time.' + metricUrl, value: elapsedTime, tags: { path } })

        return response
    } catch (error) {
        const endTime = Date.now()
        const elapsedTime = endTime - startTime

        logger.error({ msg: 'fetch: failed with error', url, path, host, reqId: parentReqId, error, elapsedTime })

        Mertrics.increment({ name: 'fetch.error.' + metricUrl, value: 1, tags: { path } })
        throw error
    }
}

module.exports = {
    fetch,
}