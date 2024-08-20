const os = require('os')

const { pickBy } = require('lodash')
const nodeFetch = require('node-fetch')

const conf = require('@open-condo/config')

const { getExecutionContext } = require('./executionContext')
const { getLogger } = require('./logging')
const Mertrics = require('./metrics')


const logger = getLogger('fetch')

const FETCH_COUNT_METRIC_NAME = 'fetch.count'
const FETCH_TIME_METRIC_NAME = 'fetch.time'

const HOSTNAME = os.hostname() || 'nohost'
const NAMESPACE = conf.NAMESPACE || 'nospace'
const VERSION = conf.WERF_COMMIT_HASH || 'local'

const getAppName = () => {
    if (conf.APP_NAME) {
        return conf.APP_NAME
    }

    if (!HOSTNAME.startsWith('condo')) {
        return HOSTNAME
    }

    const splittedHostname = HOSTNAME.split('-')
    if (splittedHostname.length < 3) {
        return HOSTNAME
    }

    return HOSTNAME
        .split('-')
        .reverse()
        .slice(2)
        .reverse()
        .join('-')
}

async function fetchWithLogger (url, options, extraAttrs) {

    const urlObject = new URL(url)
    const hostname = urlObject.hostname
    const path = urlObject.pathname

    const executionContext = getExecutionContext()
    const parentReqId = executionContext.reqId
    const startReqId = executionContext.startReqId
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

        const deployment = getAppName()
        const xRemoteApp = NAMESPACE ? `${NAMESPACE}-${deployment}` : deployment
        const xRemoteClient = HOSTNAME
        const xTarget = options.headers['X-Target']
        const referrer = `http://${xRemoteClient}/${parentReqId || parentTaskId || parentExecId || ''}?${(xTarget) ? 't=' + xTarget + '&' : ''}${(startReqId) ? 's=' + startReqId + '&' : ''}`

        options.headers['X-Remote-Client'] = HOSTNAME
        options.headers['X-Remote-App'] = xRemoteApp
        options.headers['X-Remote-Version'] = VERSION
        options.headers['X-Parent-Request-ID'] = parentReqId
        options.headers['X-Start-Request-ID'] = startReqId
        options.headers['X-Parent-Task-ID'] = parentTaskId
        options.headers['X-Parent-Exec-ID'] = parentExecId
        options.headers['User-Agent'] = VERSION ? `node ${xRemoteApp} ${VERSION}` : `node ${xRemoteApp}`
        options.headers['Referrer'] = xTarget ? `${referrer}?t=${xTarget}` : referrer

        options.headers = pickBy(options.headers)
    }

    const startTime = Date.now()
    const requestLogCommonData = pickBy({
        reqId: parentReqId,
        startReqId,
        taskId: parentTaskId,
        execId: parentExecId,
        headers: options.headers,
        url, path, hostname,
    })

    try {
        logger.info({ msg: 'fetch: request start', ...requestLogCommonData })

        const response = await nodeFetch(url, options)

        const headers = (response.headers && typeof response.headers == 'object') ? Object.fromEntries(response.headers) : {}

        const endTime = Date.now()
        const responseTime = endTime - startTime
        const childReqId = response.headers && response.headers.get('X-Request-ID')

        logger.info({ msg: 'fetch: request successful', childReqId, responseHeaders: { headers }, status: response.status, responseTime, ...requestLogCommonData })

        Mertrics.increment({ name: FETCH_COUNT_METRIC_NAME, value: 1, tags: { status: response.status, hostname, path } })
        Mertrics.gauge({ name: FETCH_TIME_METRIC_NAME, value: responseTime, tags: { status: response.status, hostname, path } })

        return response
    } catch (err) {
        const endTime = Date.now()
        const responseTime = endTime - startTime

        logger.error({ msg: 'fetch: failed with error', err, responseTime, status: 0, ...requestLogCommonData })

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