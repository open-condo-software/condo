const nodeFetch = require('node-fetch')

const { getExecutionContext } = require('./executionContext')
const { getLogger } = require('./logging')
const Mertrics = require('./metrics')

const logger = getLogger('fetch')

const FETCH_COUNT_METRIC_NAME = 'fetch.count'
const FETCH_TIME_METRIC_NAME = 'fetch.time'


async function fetchWithLogger (url, options, extraAttrs) {

    const urlObject = new URL(url)
    const hostname = urlObject.hostname
    const path = urlObject.pathname

    const executionContext = getExecutionContext()
    const parentReqId = executionContext.reqId
    const parentTaskId = executionContext.taskId
    const parentExecId = executionContext.execId

    const { skipTracingHeaders } = extraAttrs

    if (!skipTracingHeaders) {
        // We want to set special headers to track requests across the microservices:
        // Client --reqId-> Condo --reqId-> AddressService
        //                    ^                   ^
        //                    |                   |
        //               log reqId            log reqId
        //
        if (!options.headers) {
            options.headers = {}
        }

        options.headers['X-Parent-Request-ID'] = parentReqId
        options.headers['X-Parent-Task-ID'] = parentTaskId
        options.headers['X-Parent-Exec-ID'] = parentExecId
        options.headers['X-Remote-Client'] = hostname
    }

    const startTime = Date.now()

    try {
        logger.info({ msg: 'fetch: request start', url, reqId: parentReqId, taskId: parentTaskId, execId: parentExecId, path, hostname })

        const response = await nodeFetch(url, options)

        const headers = (response.headers && typeof response.headers == 'object') ? Object.fromEntries(response.headers) : {}

        const endTime = Date.now()
        const responseTime = endTime - startTime
        const childReqId = response.headers && response.headers.get('X-Request-ID')

        logger.info({ msg: 'fetch: request successful', url, reqId: parentReqId, childReqId, responseHeaders: { headers }, taskId: parentTaskId, execId: parentExecId, path, hostname, status: response.status, responseTime })

        Mertrics.increment({ name: FETCH_COUNT_METRIC_NAME, value: 1, tags: { status: response.status, hostname, path } })
        Mertrics.gauge({ name: FETCH_TIME_METRIC_NAME, value: responseTime, tags: { status: response.status, hostname, path } })

        return response
    } catch (err) {
        const endTime = Date.now()
        const responseTime = endTime - startTime

        logger.error({ msg: 'fetch: failed with error', url, path, hostname, reqId: parentReqId, taskId: parentTaskId, execId: parentExecId, err, responseTime })

        Mertrics.increment({ name: FETCH_COUNT_METRIC_NAME, value: 1, tags: { status: 'failed', hostname, path } })
        Mertrics.gauge({ name: FETCH_TIME_METRIC_NAME, value: responseTime, tags: { status: 'failed', hostname, path } })

        throw err
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
 * @param {boolean} [options.skipTracingHeaders] - Sets X-Request-ID, reqId, taskId headers based on local execution context
 * @returns {Promise<Response>} - A Promise resolving to the Response object representing the fetched data.
 * @throws {Error} - If the maximum number of retries is reached or if an error occurs during the fetch operation.
 */
const fetchWithRetriesAndLogger = async (url, options = {}) => {
    const {
        maxRetries = 0,
        abortRequestTimeout = 60 * 1000,
        timeoutBetweenRequests = 0,
        skipTracingHeaders = false,
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
                fetchWithLogger(url, { ... fetchOptions, signal }, { skipTracingHeaders }),
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