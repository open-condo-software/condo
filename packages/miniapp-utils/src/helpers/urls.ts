const REGEXP_ESCAPE_CHARS = /[\\^$.*+?()[\]{}|]/g
const WILDCARD_REGEXP_PART = '([a-zA-Z0-9-]{1,63})'
const WILDCARD_REGEXP_PART_ESCAPED = _escapeRegexp(WILDCARD_REGEXP_PART)

type URLCache = Map<string, URL>
type RegExpCache = Map<string, RegExp>

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

export function replaceDomainPrefix (originalUrl: string, prefix: string): string {
    const url = new URL(originalUrl)

    const originalHostnameParts = url.hostname.split('.')
    const suffixParts = originalHostnameParts.length > 2 ? originalHostnameParts.slice(1) : originalHostnameParts
    const suffix = suffixParts.join('.')

    url.hostname = `${prefix}.${suffix}`

    return url.toString()
}

function _escapeRegexp (source: string) {
    return source.replace(REGEXP_ESCAPE_CHARS, '\\$&')
}

type ReplaceDomainOptions = { encoded?: boolean, urlsCache?: URLCache, regexpsCache?: RegExpCache }

function _getUrl (strUrl: string, cache?: URLCache): URL {
    if (!cache) return new URL(strUrl)

    let parsed = cache.get(strUrl)
    if (!parsed) {
        parsed = new URL(strUrl)
        cache.set(strUrl, parsed)
    }
    return parsed
}

/** NOTE: Don't use it outside of this file, since it mutates lastIndex */
function _getCachedRegexp (pattern: string, cache?: RegExpCache): RegExp {
    // NOTE: no user input here
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    if (!cache) return new RegExp(pattern, 'g')

    let re = cache.get(pattern)
    if (!re) {
        // NOTE: no user input here
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        re = new RegExp(pattern, 'g')
        cache.set(pattern, re)
    }
    re.lastIndex = 0
    return re
}

export function getWildcardDomain (domain: string, cache?: URLCache) {
    const url = _getUrl(domain, cache)
    const [prefix, ...rest] = url.hostname.split('.')
    const port = url.port ? `:${url.port}` : ''
    return {
        wildcardDomain: `${url.protocol}//*.${rest.join('.')}${port}`,
        prefix,
    }
}

export function replaceDomain (source: string, from: string, to: string, options: ReplaceDomainOptions = {}): string {
    const { encoded = false, urlsCache, regexpsCache } = options

    const fromUrl = _getUrl(from, urlsCache)
    // NOTE: URL parser encodes * as %2A in some browsers (Chromium), so decode the hostname to check for wildcards
    const decodedHostname = decodeURIComponent(fromUrl.hostname)

    // NOTE: for non-wildcard domain just do simple replace
    if (!decodedHostname.startsWith('*.')) {
        let replaced = source.replaceAll(from, to)
        if (encoded) {
            const fromEncoded = encodeURIComponent(from)
            const toEncoded = encodeURIComponent(to)
            replaced = replaced.replaceAll(fromEncoded, toEncoded)
        }

        return replaced
    }

    // NOTE: need to apply some magic on wildcards
    // NOTE: only first * is needed
    // nosemgrep: javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization
    const fromPattern = from.replace('*', WILDCARD_REGEXP_PART)
    // NOTE: only first * is needed
    // nosemgrep: javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization
    const toPattern = to.replace('*', '$1')

    const escapedFrom = _escapeRegexp(fromPattern).replace(WILDCARD_REGEXP_PART_ESCAPED, WILDCARD_REGEXP_PART)
    const fromSearch = _getCachedRegexp(escapedFrom, regexpsCache)

    let replaced = source.replace(fromSearch, toPattern)

    if (encoded) {
        // NOTE: only first * is needed
        // nosemgrep: javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization
        const fromEncoded = encodeURIComponent(from).replace('*', WILDCARD_REGEXP_PART)
        // NOTE: only first * is needed
        // nosemgrep: javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization
        const toEncoded = encodeURIComponent(to).replace('*', '$1')

        const escapedFromEncoded = _escapeRegexp(fromEncoded).replace(WILDCARD_REGEXP_PART_ESCAPED, WILDCARD_REGEXP_PART)
        const fromEncodedSearch = _getCachedRegexp(escapedFromEncoded, regexpsCache)

        replaced = replaced.replace(fromEncodedSearch, toEncoded)
    }

    return replaced
}
