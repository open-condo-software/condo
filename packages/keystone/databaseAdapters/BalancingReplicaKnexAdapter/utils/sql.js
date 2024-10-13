const get = require('lodash/get')
const { Parser } = require('node-sql-parser/build/postgresql')

const { logger } = require('./logger')

const SUPPORTED_PG_OPERATIONS = new Set(['insert', 'select', 'update', 'delete', 'show'])

const parser = new Parser()

function _extractTableByFromArgument (ast) {
    const from = get(ast, 'from', []) || []
    const nonJoinedTable = from.find(table => !table.join)

    return get(nonJoinedTable, 'table')
}

function _extractTableByTableArgument (sqlString, ast) {
    const tables = get(ast, 'table', [])

    if (!Array.isArray(tables)) {
        return tables.table
    }

    if (tables.length !== 1) {
        logger.error({ msg: 'Unexpected table argument length', sqlQuery: sqlString })
        throw new Error(`Unexpected table argument length. ${JSON.stringify({ sqlString, tables })}`)
    }

    return tables[0].table
}

function extractCRUDQueryData (sqlString) {
    let ast
    try {
        ast = parser.astify(sqlString)
    } catch (err) {
        logger.error({ msg: 'SQL query cannot be parsed', sqlQuery: sqlString })
        throw new Error(`Provided SQL query cannot be parsed: "${sqlString}"`)
    }


    // NOTE: Array is possible, since there's sqlString.split(';') in astify
    // and we're not supporting this type of bulked SQL
    if (Array.isArray(ast)) {
        if (ast.length === 0 || ast.length > 1) {
            logger.error({ msg: 'Invalid ast length', sqlQuery: sqlString })
            throw new Error(`Invalid ast length for query: "${sqlString}"`)
        }

        ast = ast[0]
    }
    const operation = get(ast, 'type')

    if (!SUPPORTED_PG_OPERATIONS.has(operation)) {
        logger.error({ msg: 'Unsupported operation provided', sqlQuery: sqlString, sqlOperation: operation })
        throw new Error(
            'Unsupported operation provided. ' +
            `Expected to be one of the following: [${[...SUPPORTED_PG_OPERATIONS].join(', ')}], ` +
            `but got: ${operation}`
        )
    }

    let table = undefined

    if (operation === 'select') {
        table = _extractTableByFromArgument(ast)
    } else if (operation === 'insert' || operation === 'update') {
        table = _extractTableByTableArgument(sqlString, ast)
    } else if (operation === 'delete') {
        table = _extractTableByFromArgument(ast)
    }

    return { operation, table }
}



module.exports = {
    SUPPORTED_PG_OPERATIONS,
    extractCRUDQueryData,
}