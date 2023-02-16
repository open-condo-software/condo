const KEYWORDS_SPECIAL_SYMBOLS_REGEX = /[!@#$%^&*)(+=.,\-_:;"'`[\]]/g
/**
 * @type {string}
 */
const OVERRIDING_ROOT = 'meta.data'

//
// ERRORS
//
const SOURCE_ALREADY_EXISTS_ERROR = 'SOURCE_ALREADY_EXISTS_ERROR'

module.exports = {
    KEYWORDS_SPECIAL_SYMBOLS_REGEX,
    SOURCE_ALREADY_EXISTS_ERROR,
    OVERRIDING_ROOT,
}
