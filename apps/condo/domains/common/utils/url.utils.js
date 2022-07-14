const qs = require('qs')

function getQueryParams () {
    if (typeof global === 'undefined' || !global.location) return {}
    let startIndex = global.location.href.indexOf('?')
    let endIndex = global.location.href.indexOf('#')
    if (startIndex === -1) return {}
    if (endIndex === -1) endIndex = global.location.href.length
    return qs.parse(global.location.href.substring(startIndex + 1, endIndex))
}

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

module.exports = {
    extractHostname,
    extractRootDomain,
    getQueryParams,
    extractOrigin,
}
