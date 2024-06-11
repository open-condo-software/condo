const ACCEPT_LANGUAGE_REGEXP = /((([a-zA-Z]+(-[a-zA-Z0-9]+){0,2})|\*)(;q=[0-1](\.[0-9]+)?)?)*/g

/**
 * Extract locales from accept-language header
 * SRC: https://github.com/opentable/accept-language-parser
 * Reason for fork: MIT + last release = 6 years ago
 * @param {string | null} headerValue
 * @returns {Array<{ code: string, script: string | null, region: string | undefined, quality: number }>}
 */
function parseAcceptLanguageHeader (headerValue) {
    const matches = (headerValue || '*').match(ACCEPT_LANGUAGE_REGEXP)

    return matches.map(match => {
        if (!match) {
            return null
        }
        const bits = match.split(';')
        const ietf = bits[0].split('-')
        const hasScript = ietf.length === 3

        return {
            code: ietf[0].toLowerCase(),
            script: hasScript ? ietf[1] : null,
            region: hasScript ? ietf[2] : ietf[1],
            quality: bits[1] ? parseFloat(bits[1].split('=')[1]) : 1.0,
        }
    }).filter(result => Boolean(result)).sort((a, b) => b.quality - a.quality)
}

module.exports = {
    parseAcceptLanguageHeader,
}