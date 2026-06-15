const conf = require('@open-condo/config')

const EXTERNAL_FILES_NGINX_PREFIX = '/api/external-files'

function serveStorageFile (res, { signedUrl, shallowRedirect }) {
    if (conf['FILE_SERVE_VIA_NGINX'] === 'true' || conf['FILE_SERVE_VIA_NGINX'] === '1') {
        const { pathname, search } = new URL(signedUrl)
        res.setHeader('X-Accel-Redirect', `${EXTERNAL_FILES_NGINX_PREFIX}${pathname}${search}`)
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
    serveStorageFile,
}
