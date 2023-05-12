const { JAVASCRIPT_URL_XSS } = require('@condo/domains/common/constants/regexps')

// refs to: https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
function extractHostname (url) {
    let hostname

    if (url.indexOf('//') > -1) {
        hostname = url.split('/')[2]
    } else {
        hostname = url.split('/')[0]
    }

    hostname = hostname.split(':')[0]
    hostname = hostname.split('?')[0]

    return hostname
}

function extractRootDomain (url) {
    let domain = extractHostname(url)
    const domainPaths = domain.split('.')
    const pathLength = domainPaths.length

    if (pathLength > 2) {
        domain = domainPaths[pathLength - 2] + '.' + domainPaths[pathLength - 1]
        if (domainPaths[pathLength - 2].length === 2 && domainPaths[pathLength - 1].length === 2) {
            domain = domainPaths[pathLength - 3] + '.' + domain
        }
    }

    return domain
}

// Removes the path from the link, leaving the part with subdomains and protocol
function extractOrigin (url) {
    try {
        return new URL(url).origin
    } catch {
        return null
    }
}

/**
 * Detects if url contains XSS script
 * @param url
 * @returns {boolean}
 */
function isSafeUrl (url) {
    if (!url || typeof url !== 'string') return false
    const decodedUrl = decodeURI(url)

    return !JAVASCRIPT_URL_XSS.test(decodedUrl)
}

module.exports = {
    extractHostname,
    extractRootDomain,
    extractOrigin,
    isSafeUrl,
}
