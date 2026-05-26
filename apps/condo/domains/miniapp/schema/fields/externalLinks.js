const { z } = require('zod')

const { getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')

// function validateUrlPattern (rawPattern) {
//     const pattern = new URLPattern(rawPattern)
//     if (pattern.hash || pattern.search)
//
// }

const EXTERNAL_LINKS_FIELD = {
    schemaDoc:
        'List of URLs or URLPatterns, ' +
        'containing external links that miniapp can open (via iframe or just regular links) during its work. ' +
        'Used by native clients to control user navigation',
    type: 'Json',
    graphQLReturnType: '[String!]',
    graphQLInputType: '[String!]',
    isRequired: true,
    defaultValue: [],
    hooks: {
        validateInput: getGQLErrorValidator(z.array(z.string()), 'INVALID_MINIAPP_EXTERNAL_LINKS'),
    },
}

module.exports = {
    EXTERNAL_LINKS_FIELD,
}