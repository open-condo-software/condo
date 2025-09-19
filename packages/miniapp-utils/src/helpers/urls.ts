export function isSafeUrl (url: unknown): boolean {
    if (!url || typeof url !== 'string') return false
    
    let decodedUrl: string
    try {
        decodedUrl = decodeURI(url)
    } catch (error) {
        // If decodeURI fails, treat as unsafe
        return false
    }

    // ReDoS-safe approach: normalize the string first, then use simple regex
    // Remove all control characters and whitespace, then check for javascript:
    const normalizedUrl = decodedUrl
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\s]/g, '') // Remove control chars and whitespace
        .toLowerCase()
    
    return !normalizedUrl.includes('javascript:')
}

export function extractHostname (url: string): string {
    let hostname

    if (url.indexOf('//') > -1) {
        hostname = url.split('/')[2]
    } else {
        hostname = url.split('/')[0]
    }

    hostname = hostname.split(':')[0]
    hostname = hostname.split('?')[0]
    hostname = hostname.split('#')[0]

    return hostname
}