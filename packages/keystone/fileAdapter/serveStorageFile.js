const conf = require('@open-condo/config')

const DEFAULT_FILESTORE_PREFIX = '/filestore'

function isTruthyEnv (value) {
    return value === 'true' || value === '1'
}

function isFileServeViaNginxEnabled () {
    return isTruthyEnv(conf['FILE_SERVE_VIA_NGINX'])
}

function getFilestorePrefix () {
    const prefix = conf['FILE_NGINX_FILESTORE_PREFIX']
        || conf['FILE_NGINX_INTERNAL_STORAGE_PREFIX']
        || DEFAULT_FILESTORE_PREFIX
    return prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
}

/**
 * Builds X-Accel-Redirect path from a signed storage URL.
 * nginx internal location proxies the path+query to the storage upstream.
 *
 * @param {string} signedUrl
 * @returns {string}
 */
function buildXAccelRedirectPath (signedUrl) {
    const { pathname, search } = new URL(signedUrl)
    return `${getFilestorePrefix()}${pathname}${search}`
}

/**
 * Sends a file to the client after auth: redirect to storage (default) or X-Accel-Redirect for nginx proxy.
 *
 * @param {import('express').Response} res
 * @param {{ signedUrl: string, shallowRedirect?: string | boolean }} options
 */
function serveStorageFile (res, { signedUrl, shallowRedirect }) {
    if (isFileServeViaNginxEnabled()) {
        res.setHeader('X-Accel-Redirect', buildXAccelRedirectPath(signedUrl))
        res.status(200)
        res.end()
        return
    }

    if (shallowRedirect) {
        res.status(200)
        res.json({ redirectUrl: signedUrl })
        return
    }

    res.redirect(signedUrl)
}

module.exports = {
    DEFAULT_FILESTORE_PREFIX,
    isFileServeViaNginxEnabled,
    getFilestorePrefix,
    buildXAccelRedirectPath,
    serveStorageFile,
}
