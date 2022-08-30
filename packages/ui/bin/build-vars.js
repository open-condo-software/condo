const path = require('path')
const pluralize = require('pluralize')
const get = require('lodash/get')
const config = require(path.join(__dirname, '../sd.config.js'))

const RAW_INT_TYPES = ['fontWeight', 'opacity']

const SHRINKABLE_HEX_PATTERN = /^#(([0-9a-f])\2){3}$/gmi

const WEIGHT_TO_INT = {
    light: 300,
    regular: 400,
    semiBold: 700,
    bold: 700,
    extraBold: 800,
}

const isMatchingType  = (token, types) => {
    if (!Array.isArray(types)) {
        types = [types]
    }
    return token.type && types.some(t => t === token.type || pluralize.plural(t) === token.type)
}

const getObjectPropertyWithMeasure = (obj, propertyPath, measure = 'px') => {
    const value = get(obj, propertyPath, 0)

    return value ? `${value}${measure}` : value
}

const getShortHex = (hex) => {
    return `#${hex.charAt(1)}${hex.charAt(3)}${hex.charAt(5)}`
}

const StyleDictionary = require('style-dictionary').extend(config)

/**
 * Adds px suffix to any sizing values without one
 */
StyleDictionary.registerTransform({
    name: 'transformer/int-px',
    type: 'value',
    matcher: (token) => {
        const isNumber = Boolean(typeof token.original.value === 'number')
        const isAllowedTransform = !isMatchingType(token, RAW_INT_TYPES)

        return isNumber && isAllowedTransform && token.original.value !== 0
    },
    transformer: (token) => {
        return `${token.original.value}px`
    },
})

/**
 * Wraps specified single font in ""
 * and uses sans-serif as a fallback
 */
StyleDictionary.registerTransform({
    name: 'transformer/fonts/sans-serif',
    type: 'value',
    matcher: (token) => {
        const isFont = isMatchingType(token, 'fontFamily')
        const isSingleFont = Boolean(typeof token.original.value === 'string' && !token.original.value.includes(','))
        return isFont && isSingleFont
    },
    transformer: (token) => {
        return `"${token.original.value}", sans-serif`
    },
})

/**
 * Converts font weights in string format to integer representation
 */
StyleDictionary.registerTransform({
    name: 'transformer/fonts/int-weight',
    type: 'value',
    matcher: (token) => {
        const isString = Boolean(typeof token.original.value === 'string')
        const isAllowedCategory = isMatchingType(token, 'fontWeight')

        return isString && isAllowedCategory
    },
    transformer: (token) => {
        for (const key of Object.keys(WEIGHT_TO_INT)) {
            if (key.toLowerCase() === token.original.value.toLowerCase()) {
                return WEIGHT_TO_INT[key]
            }
        }

        return token.original.value
    },
})

/**
 * Converts figma-style box-shadows to css ones
 */
StyleDictionary.registerTransform({
    name: 'transformer/shadow-css',
    type: 'value',
    matcher: (token) => {
        const isObjectValue = Boolean(typeof token.original.value === 'object')
        const isBoxShadow = isMatchingType(token, 'boxShadow')

        return isBoxShadow && isObjectValue
    },
    transformer: (token) => {
        const tokenValue = token.original.value
        const parts = []

        const shadowType = get(tokenValue, ['type'], 'dropShadow')
        if (shadowType !== 'dropShadow') {
            parts.push('inset')
        }

        parts.push(getObjectPropertyWithMeasure(tokenValue, 'x'))
        parts.push(getObjectPropertyWithMeasure(tokenValue, 'y'))
        parts.push(getObjectPropertyWithMeasure(tokenValue, 'blur'))
        parts.push(getObjectPropertyWithMeasure(tokenValue, 'spread'))

        const color = get(tokenValue, 'color', '#000')
        if (SHRINKABLE_HEX_PATTERN.test(color)) {
            parts.push(getShortHex(color))
        } else {
            parts.push(color)
        }

        return parts.join(' ')
    },
})

/**
 * Converts hex-colors to short 3-letter notation if it's possible
 */
StyleDictionary.registerTransform({
    name: 'transformer/short-hex',
    type: 'value',
    matcher: (token) => {
        const isColor = isMatchingType(token, 'color')
        const isShrinkableHex = Boolean(typeof token.value === 'string' && SHRINKABLE_HEX_PATTERN.test(token.value))

        return isColor && isShrinkableHex
    },
    transformer: (token) => {
        return getShortHex(token.value)
    },
})

/**
 * Converts hex-colors to lower case
 */
StyleDictionary.registerTransform({
    name: 'transformer/lower-hex',
    type: 'value',
    matcher: (token) => {
        const isColor = isMatchingType(token, 'color')
        const isString = Boolean(typeof token.value === 'string')

        return isColor && isString
    },
    transformer: (token) => {
        return token.value.toLowerCase()
    },
})

StyleDictionary.buildAllPlatforms()

