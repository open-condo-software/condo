const { escapeRegExp, isLength, get } = require('lodash')

const conf = require('@open-condo/config')

function parseDatabaseUrl (url) {
    try {
        if (typeof url !== 'string') throw new Error('wrong database url type: we expect string')
        url = url.trim()
        if (!url.startsWith('custom:{') || !url.endsWith('}')) throw new Error('wrong database url format should be like: `custom:{ .. }`')
        const data = JSON.parse(url.substring('custom:'.length))
        Object.keys(data).forEach((key) => {
            if (!key || !data[key]) throw new Error('wrong database url format: empty key')
            if (typeof key !== 'string' || !['string', 'object'].includes(typeof data[key])) {
                throw new Error('wrong database url format: should contains only strings')
            }
        })
        return data
    } catch (e) {
        console.warn(e)
        return undefined
    }
}

function parseDatabaseMapping (mapping, databases) {
    try {
        if (typeof databases !== 'object' || databases === null || !databases) throw new Error('invalid database mapping: incorrect database url parsing')
        const list = JSON.parse(mapping)
        if (list.length < 1) throw new Error('invalid database mapping length')
        let hasDefaultMatch = 0
        list.forEach((item) => {
            if (!item.match || !item.query || !item.command) throw new Error('invalid database mapping item: no match, query or command key')
            if (typeof item.match !== 'string' || typeof item.query !== 'string' || typeof item.command !== 'string') throw new Error('invalid database mapping item type')
            if (!['string', 'object'].includes(typeof databases[item.query])) throw new Error('invalid database mapping database `query` name')
            if (!['string', 'object'].includes(typeof databases[item.command])) throw new Error('invalid database mapping database `command` name')
            if (item.match === '*') {
                hasDefaultMatch++
            }
        })
        if (!hasDefaultMatch) throw new Error('invalid database mapping item: you should add match with "*"')
        return list
    } catch (e) {
        console.warn(e)
        return undefined
    }
}

function matchPattern (pattern, str) {
    let regex = null
    if (pattern.includes('*')) {
        // This cade can be reachable only from ENV variables. And already escaped any third party RE chars
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        regex = new RegExp('^' + pattern.split('*').map(escapeRegExp).join('.*?') + '$')
    } else {
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        regex = new RegExp('^' + escapeRegExp(pattern) + '$')
    }
    return regex.test(str)
}

function matchDatabase (mapping, str) {
    if (isLength(mapping) && mapping >= 1) throw new Error('matchDatabase(mapping) is not an array')

    for (let { match, query, command } of mapping) {
        if (matchPattern(match, str)) return { match, query, command }
    }

    return undefined
}

/**
 * Returns active database adapter. Might be helpful when you need to build custom query
 * @param keystone {import('@keystonejs/keystone').Keystone} keystone instance
 * @param list {string} list selector of the database. Default list selection is wildcard (*)
 * @returns {import('@keystonejs/keystone').BaseKeystoneAdapter}
 */
function getDatabaseAdapter (keystone, list = '*') {
    const databaseUrl = get(conf, 'DATABASE_URL')

    if (databaseUrl.startsWith('postgres')) {
        return keystone.adapter
    } else if (databaseUrl.startsWith('custom')) {
        if (list === '*') {
            return keystone.adapter.__databaseAdapters.default
        }
        throw new Error('Multiple list adapters support is not implemented!')
    } else {
        throw new Error('invalid database adapter')
    }
}

function getListAdapters (keystone) {
    const databaseUrl = get(conf, 'DATABASE_URL')

    if (databaseUrl.startsWith('postgres')) {
        return keystone.adapter.listAdapters
    } else if (databaseUrl.startsWith('custom')) {
        return keystone.adapter.__listMappingAdapters
    } else {
        throw new Error('Unsupported database adapter')
    }
}

module.exports = {
    parseDatabaseUrl,
    parseDatabaseMapping,
    matchPattern,
    matchDatabase,
    getDatabaseAdapter,
    getListAdapters,
}
