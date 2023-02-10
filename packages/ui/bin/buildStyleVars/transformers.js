const get = require('lodash/get')
const pluralize = require('pluralize')

const RAW_INT_TYPES = ['fontWeight', 'opacity']
const RELATIVE_EM_TYPES = ['letterSpacing', 'paragraphSpacing']

const SHRINKABLE_HEX_PATTERN = /^#(([0-9a-f])\2){3}$/i

const WEIGHT_TO_INT = {
    light: 300,
    regular: 400,
    semiBold: 600,
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

/**
 * Adds px suffix to any sizing values without one
 */
const intToPxTransformer = {
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
}

/**
 * Wraps specified single font in ""
 * and uses CSS var for font-callback
 * CSS var can be patched in app directly to remove flicker effects
 */
const fontFallbackTransformer = {
    name: 'transformer/fonts/fallback',
    type: 'value',
    matcher: (token) => {
        const isFont = isMatchingType(token, 'fontFamily')
        const isSingleFont = Boolean(typeof token.original.value === 'string' && !token.original.value.includes(','))
        return isFont && isSingleFont
    },
    transformer: (token) => {
        return `"${token.original.value}", var(--condo-font-fallback)`
    },
}


/**
 * Converts font weights in string format to integer representation
 */
const weightToIntTransformer = {
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
}

/**
 * Converts figma-style box-shadows to css ones
 */
const boxShadowTransformer = {
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
}

/**
 * Converts hex-colors to short 3-letter notation if it's possible
 */
const shortHexTransformer = {
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
}

/**
 * Converts hex-colors to lower case
 */
const lowerHexTransformer = {
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
}


/**
 * Transform relative values in percents to em
 */
const percentToEmTransformer = {
    name: 'transformer/percent-to-em',
    type: 'value',
    matcher: (token) => {
        const isTypeMatch = isMatchingType(token, RELATIVE_EM_TYPES)
        const isPercent = Boolean(typeof token.value === 'string' && token.value.endsWith('%'))

        return isTypeMatch && isPercent
    },
    transformer: (token) => {
        return `${(parseFloat(token.value) / 100).toFixed(2)}em`
    },
}

const allTransformers = [
    fontFallbackTransformer,
    intToPxTransformer,
    weightToIntTransformer,
    boxShadowTransformer,
    shortHexTransformer,
    lowerHexTransformer,
    percentToEmTransformer,
]

const webVarsTransformersChain = [
    'name/cti/kebab',
    'transformer/int-px',
    'transformer/fonts/fallback',
    'transformer/fonts/int-weight',
    'transformer/shadow-css',
    'transformer/short-hex',
    'transformer/lower-hex',
    'transformer/percent-to-em',
]

module.exports = {
    allTransformers,
    webVarsTransformersChain,
}