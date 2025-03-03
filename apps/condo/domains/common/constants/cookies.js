// NOTE: https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#section-5.5
// https://developer.chrome.com/blog/cookie-max-age-expires?hl=ru
// The limit SHOULD NOT be greater than 400 days (that's a little over 13 months)
const COOKIE_MAX_AGE_IN_SEC = 13 * 30 * 24 * 60 * 60 // 13 months in seconds


module.exports = {
    COOKIE_MAX_AGE_IN_SEC,
}
