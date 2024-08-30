const os = require('os')

const conf = require('@open-condo/config')

const HOSTNAME = os.hostname() || 'nohost'
const NAMESPACE = conf.NAMESPACE || 'nospace'
const VERSION = conf.WERF_COMMIT_HASH || 'local'
const APP = conf.APP_NAME

const _getAppName = () => {
    if (APP) {
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

function getXRemoteApp () {
    const deployment = _getAppName()
    return NAMESPACE ? `${NAMESPACE}-${deployment}` : deployment
}

function getXRemoteClient () {
    return HOSTNAME
}

function getXRemoteVersion () {
    return VERSION
}

module.exports = {
    getXRemoteApp,
    getXRemoteClient,
    getXRemoteVersion,
}