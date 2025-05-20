const { get, set } = require('lodash')

const HIDE_GRAPHQL_VARIABLES_KEYS = ['secret', 'password', 'receipts', 'data.password', 'data.secret', 'data.receipts']

function normalizeQuery (string) {
    if (!string) return ''
    // NOTE(pahaz): https://spec.graphql.org/June2018/#sec-Insignificant-Commas
    //   Similar to white space and line terminators, commas (,) are used to improve the legibility of source text
    return string.replace(/[\s,]+/g, ' ').trim()
}

function normalizeVariables (object) {
    if (!object) return undefined
    const data = JSON.parse(JSON.stringify(object))
    for (const key of HIDE_GRAPHQL_VARIABLES_KEYS) {
        if (get(data, key)) {
            set(data, key, '***')
        }
    }
    return JSON.stringify(data)
}

module.exports = {
    normalizeQuery,
    normalizeVariables,
}
