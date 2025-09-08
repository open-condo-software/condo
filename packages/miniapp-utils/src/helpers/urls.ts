const JAVASCRIPT_URL_XSS = /[u00-u1F]*j[\s]*a[\s]*v[\s]*a[\s]*s[\s]*c[\s]*r[\s]*i[\s]*p[\s]*t[\s]*:/i

export function isSafeUrl (url: unknown): boolean {
    if (!url || typeof url !== 'string') return false
    const decodedUrl = decodeURI(url)

    return !JAVASCRIPT_URL_XSS.test(decodedUrl)
}