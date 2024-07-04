const nodeFetch = require('node-fetch')

const { getExecutionContext } = require('./executionContext')
const { getLogger } = require('./logging')
const Mertrics = require('./metrics')

const logger = getLogger('fetch')

const FETCH_COUNT_METRIC_NAME = 'fetch.count'
const FETCH_TIME_METRIC_NAME = 'fetch.time'

async function fetchWithLogger (url, options) {

    const urlObject = new URL(url)
    const hostname = urlObject.hostname
    const path = urlObject.pathname

    const executionContext = getExecutionContext()
    const parentReqId = executionContext.reqId

    const startTime = Date.now()

    try {
        const response = await nodeFetch(url, options)

        const endTime = Date.now()
        const elapsedTime = endTime - startTime

        logger.info({ msg: 'fetch: request successful', url, reqId: parentReqId, path, hostname, status: response.status, elapsedTime })

        Mertrics.increment({ name: FETCH_COUNT_METRIC_NAME, value: 1, tags: { status: response.status, hostname, path } })
        Mertrics.gauge({ name: FETCH_TIME_METRIC_NAME, value: elapsedTime, tags: { status: response.status, hostname, path } })

        return response
    } catch (error) {
        const endTime = Date.now()
        const elapsedTime = endTime - startTime

        logger.error({ msg: 'fetch: failed with error', url, path, hostname, reqId: parentReqId, error, elapsedTime })

        Mertrics.increment({ name: FETCH_COUNT_METRIC_NAME, value: 1, tags: { status: 'failed', hostname, path } })
        Mertrics.gauge({ name: FETCH_TIME_METRIC_NAME, value: elapsedTime, tags: { status: 'failed', hostname, path } })

        throw error
    }
}

const sleep = (timeout) => new Promise(resolve => setTimeout(resolve, timeout))

/**
 * Asynchronous function to fetch data from a URL with customizable options and retries.
 * Default behavior is similar to fetchWithLogger only limits the time for request to be completed in 1 minute
 * @param {string} url - The URL to fetch data from.
 * @param {Object} [options] - Optional parameters for configuring the fetch request.
 * @param {number} [options.maxRetries=0] - Maximum number of retries before giving up.
 * @param {number} [options.abortRequestTimeout=60000] - Time in milliseconds to wait before aborting a request.
 * @param {number} [options.timeoutBetweenRequests=0] - Time in milliseconds to wait between retry attempts. Will be multiplied by the attempt number
 * @returns {Promise<Response>} - A Promise resolving to the Response object representing the fetched data.
 * @throws {Error} - If the maximum number of retries is reached or if an error occurs during the fetch operation.
 */
const fetchWithRetriesAndLogger = async (url, options = {}) => {
    const {
        maxRetries = 0,
        abortRequestTimeout = 60 * 1000,
        timeoutBetweenRequests = 0,
        ...fetchOptions
    } = options
    let retries = 0
    let lastError
    let lastResponse
    // At least one request on maxRetries = 0
    do {
        try {
            const controller = new AbortController()
            const signal = controller.signal
            const response = await Promise.race([
                fetchWithLogger(url, { ... fetchOptions, signal }),
                new Promise((_, reject) =>
                    setTimeout(() => {
                        controller.abort()
                        reject(new Error('Abort request by timeout'))
                    }, abortRequestTimeout)
                ),
            ])
            if (response && response.ok) {
                return response
            }
            lastResponse = response
        } catch (error) {
            lastError = error
        }
        retries++
        if (timeoutBetweenRequests) {
            await sleep(retries * timeoutBetweenRequests)
        }
    }  while (retries < maxRetries)
    if (lastError) {
        throw new Error(lastError)
    }
    return lastResponse
}

module.exports = {
    fetch: fetchWithRetriesAndLogger,
}