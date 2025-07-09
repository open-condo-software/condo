const { DeepRedact } = require('@hackylabs/deep-redact')

function getPartialStringTest (pattern, replaceText) {
    return {
        pattern: pattern,
        replacer: (value, pattern) => value.replaceAll(pattern, `${replaceText}`),
    }
}

const deepRedact = new DeepRedact({
    partialStringTests: [
        getPartialStringTest(/(\+?\d{1,4}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?[\d\s-]{6,14}\d/g, '[phone]'),
        getPartialStringTest(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]'),
    ],

    retainStructure: true,
    types: ['string', 'object'],
})

function removeSensitiveDataFromObj (obj) {
    return deepRedact.redact(obj)
}

module.exports = {
    removeSensitiveDataFromObj,
}
