const _charMap = require('@open-condo/slugify/config/charMap')
const _locales = require('@open-condo/slugify/config/locales')
    

;(function (name, root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory()
        module.exports['default'] = factory()
    }
    else {
        root[name] = factory()
    }
}('slugify', this, function () {
    let charMap = Object.assign({}, _charMap)
    const locales = Object.assign({}, _locales)
    function replace (string, options) {
        if (typeof string !== 'string') {
            throw new Error('slugify: string argument expected')
        }

        options = (typeof options === 'string')
            ? { replacement: options }
            : options || {}

        const locale = locales[options.locale] || {}

        const replacement = options.replacement === undefined ? '-' : options.replacement

        const trim = options.trim === undefined ? true : options.trim

        let slug = string.normalize().split('')
            // replace characters based on charMap
            .reduce(function (result, ch) {
                let appendChar = locale[ch]
                if (appendChar === undefined) appendChar = charMap[ch]
                if (appendChar === undefined) appendChar = ch
                if (appendChar === replacement) appendChar = ' '
                return result + appendChar
                    // remove not allowed characters
                    .replace(options.remove || /[^\w\s$*_+~.()'"!\-:@]+/g, '')
            }, '')

        if (options.strict) {
            slug = slug.replace(/[^A-Za-z0-9\s]/g, '')
        }

        if (trim) {
            slug = slug.trim()
        }

        // Replace spaces with replacement character, treating multiple consecutive
        // spaces as a single space.
        slug = slug.replace(/\s+/g, replacement)

        if (options.lower) {
            slug = slug.toLowerCase()
        }

        return slug
    }

    replace.extend = function (customMap) {
        Object.assign(charMap, customMap)
    }

    replace.extendLocale = function (locale, customMap) {
        if (!locales[locale]) {
            locales[locale] = {}
        }
        Object.assign(locales[locale], customMap)
    }

    replace.reset = function () {
        charMap = Object.assign({}, _charMap)
    }

    return replace
}))