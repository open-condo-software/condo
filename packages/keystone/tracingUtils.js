const os = require('os')

const conf = require('@open-condo/config')

const HOSTNAME = os.hostname() || 'nohost'
const NAMESPACE = conf.NAMESPACE || 'nospace'
const VERSION = conf.WERF_COMMIT_HASH || 'local'
const APP = conf.APP_NAME

/**
 * Examples: condo-worker-low, condo-worker-medium, condo-worker-high, condo-app
 * @returns {string}
 */
function getAppName () {
    if (typeof APP === 'string' && APP) {
        return APP
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

/**
 * Examples: development-condo-app, production-condo-app, production-condo-worker-low, development-condo-worker-low
 * @returns {string}
 */
function getXRemoteApp () {
    const deployment = getAppName()
    return NAMESPACE ? `${NAMESPACE}-${deployment}` : deployment
}

/**
 * Example: condo-app-dccbd8f8-8wn7x
 * @returns {string}
 */
function getXRemoteClient () {
    return HOSTNAME
}

/**
 * Example: 84100eb7ce4ed9f01930aea291df53cc013734e8
 * @returns {string}
 */
function getXRemoteVersion () {
    return VERSION
}

module.exports = {
    getAppName,
    getXRemoteApp,
    getXRemoteClient,
    getXRemoteVersion,
}