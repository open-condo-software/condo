const { isEmpty, get } = require('lodash')

const conf = require('@open-condo/config')


/**
 *
 * Default sets that used for detect request source by request headers.
 * Can be used as an example and for development.
 *
 * If no header sets is specified for the source, then no request will match. (Ex. []. Equivalent to not indicating the source)
 * If you specify an empty set of headers, then any request will match. (Ex. [{}])
 *
 * By defaults all requests are equal to requests from the site.
 * You need to override this value in environment variables!
 *
 * @example
 * {
 *  SOURCE_NAME_1: [{ expectedHeader: 'expectedValue1' }, { expectedHeader: 'expectedValue2' }]
 *  SOURCE_NAME_2: [{ expectedHeader1: 'expectedValue', expectedHeader2: 'expectedValue' }]
 * }
 *
 */
const DEFAULT_SETS_OF_SPECIFIC_REQUEST_HEADERS = {
    ANDROID: [],
    IOS: [],
    SITE: [{}],
}

const SETS_OF_SPECIFIC_REQUEST_HEADERS = conf.SETS_OF_SPECIFIC_REQUEST_HEADERS
    ? JSON.parse(conf.SETS_OF_SPECIFIC_REQUEST_HEADERS)
    : DEFAULT_SETS_OF_SPECIFIC_REQUEST_HEADERS

if (isEmpty(SETS_OF_SPECIFIC_REQUEST_HEADERS)) {
    console.error('You should configure header rules for request sources (Android/iOS/site/...)!' +
        '\nThe default value is used for development - all requests are equal to requests from the site.')
}

const REQUEST_SOURCES = {
    ANDROID_APP: 'ANDROID_APP',
    IOS_APP: 'IOS_APP',
    SITE: 'SITE',
    OTHER: 'OTHER',
}

const hasSpecificHeaders = (reqHeaders, setsOfSpecificHeaders) => {
    if (isEmpty(reqHeaders) || isEmpty(setsOfSpecificHeaders)) return false

    for (const requiredHeaders of setsOfSpecificHeaders) {
        if (Object.entries(requiredHeaders).every(([key, value]) => get(reqHeaders, String(key).toLowerCase()) === value)) {
            return true
        }
    }
    return false
}

const getRequestSource = (context) => {
    const headers = get(context, 'req.headers')
    if (hasSpecificHeaders(headers, SETS_OF_SPECIFIC_REQUEST_HEADERS.ANDROID)) return REQUEST_SOURCES.ANDROID_APP
    if (hasSpecificHeaders(headers, SETS_OF_SPECIFIC_REQUEST_HEADERS.IOS)) return REQUEST_SOURCES.IOS_APP
    if (hasSpecificHeaders(headers, SETS_OF_SPECIFIC_REQUEST_HEADERS.SITE)) return REQUEST_SOURCES.SITE
    return REQUEST_SOURCES.OTHER
}

module.exports = {
    hasSpecificHeaders,
    getRequestSource,
    REQUEST_SOURCES,
}
