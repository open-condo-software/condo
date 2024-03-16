const nodeFetch = require('node-fetch')

const { getExecutionContext } = require('./executionContext')
const { getLogger } = require('./logging')

const logger = getLogger('fetch')

async function fetch (url, options) {

    const executionContext = getExecutionContext()
    const parentReqId = executionContext.reqId
    const startTime = Date.now()

    try {
        const response = await nodeFetch(url, options)

        const endTime = Date.now()
        const elapsedTime = endTime - startTime

        logger.info({ msg: 'Made fetch request', url, reqId: parentReqId, status: response.status, elapsedTime })

        return response
    } catch (error) {
        console.error('Error during fetch:', error)
        logger.error({ msg: 'Error during fetch', url, reqId: parentReqId, error })
        throw error
    }
}

module.exports = {
    fetch,
}