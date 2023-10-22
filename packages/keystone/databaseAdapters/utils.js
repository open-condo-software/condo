const { escapeRegExp, isLength } = require('lodash')

function parseDatabaseUrl (url) {
    try {
        if (typeof url !== 'string') throw new Error('wrong database url type: we expect string')
        url = url.trim()
        if (!url.startsWith('custom:{') || !url.endsWith('}')) throw new Error('wrong database url format should be like: `custom:{ .. }`')
        const data = JSON.parse(url.substring('custom:'.length))
        Object.keys(data).forEach((key) => {
            if (!key || !data[key]) throw new Error('wrong database url format: empty key')
            if (typeof key !== 'string' || typeof data[key] !== 'string') throw new Error('wrong database url format: should contains only strings')
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
            if (typeof databases[item.query] !== 'string') throw new Error('invalid database mapping database `query` name')
            if (typeof databases[item.command] !== 'string') throw new Error('invalid database mapping database `command` name')
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
        regex = new RegExp('^' + pattern.split('*').map(escapeRegExp).join('.*?') + '$')
    } else {
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

module.exports = {
    parseDatabaseUrl,
    parseDatabaseMapping,
    matchPattern,
    matchDatabase,
}
