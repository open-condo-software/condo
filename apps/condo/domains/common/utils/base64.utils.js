function base64UrlEncode (str) {
    const utf8Bytes = new TextEncoder().encode(str)
    const base64 = btoa(String.fromCharCode(...utf8Bytes))
    return encodeURIComponent(base64)
}

function base64UrlDecode (encodedStr) {
    const base64 = decodeURIComponent(encodedStr)
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}

module.exports = {
    base64UrlEncode,
    base64UrlDecode,
}
