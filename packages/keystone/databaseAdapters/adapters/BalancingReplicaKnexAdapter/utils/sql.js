const get = require('lodash/get')
const { Parser } = require('node-sql-parser/build/postgresql')

const { logger } = require('./logger')

const SUPPORTED_PG_OPERATIONS = new Set(['insert', 'select', 'update', 'delete', 'show'])

const parser = new Parser()

function _normalizeTableName (tableName) {
    if (!tableName || typeof tableName !== 'string') return tableName
    const withoutQuotes = tableName.replace(/"/g, '')
    const parts = withoutQuotes.split('.')
    return parts[parts.length - 1]
}

/**
 * Helper util to extract tableName by "from" argument in node-sql-parser's AST
 * Used in "SELECT FROM <Table>" and "DELETE FROM <Table>" queries
 * @param sqlString - initial sql query to propagate inside error logs
 * @param ast - node-sql-parser's AST
 * @returns {string | undefined}
 * @private
 */
function _extractTableByFromArgument (sqlString, ast) {
    const from = get(ast, 'from', []) || []

    // "SELECT 1+1" case
    if (!from.length) {
        return undefined
    }

    const nonJoinedItem = from.find(item => !item.join)

    // "SELECT * FROM t1 JOIN t2 ..." case
    if (nonJoinedItem.table) {
        return _normalizeTableName(nonJoinedItem.table)
    }

    // "SELECT COUNT(*) FROM (SELECT ...)" case
    const subAst = get(nonJoinedItem, ['expr', 'ast'])
    if (subAst) {
        return _extractTableByFromArgument(sqlString, subAst)
    }

    logger.error({ msg: 'Unexpected from argument', sqlQuery: sqlString })
    throw new TypeError(`Unexpected from argument: "${sqlString}"`)
}

/**
 * Helper util to extract tableName by "table" argument in node-sql-parser's AST
 * Used in "UPDATE <Table>" and "INSERT INTO <Table>" queries
 * @param sqlString - initial sql query to propagate inside error logs
 * @param ast - node-sql-parser's AST
 * @returns {string | undefined}
 * @private
 */
function _extractTableByTableArgument (sqlString, ast) {
    const tables = get(ast, 'table', [])

    if (!Array.isArray(tables)) {
        return _normalizeTableName(tables.table)
    }

    if (tables.length !== 1) {
        logger.error({ msg: 'Unexpected table argument length', sqlQuery: sqlString })
        throw new Error(`Unexpected table argument length. ${JSON.stringify({ sqlString, tables })}`)
    }

    return _normalizeTableName(tables[0].table)
}

/**
 * Analyzes sql query and extracts its metadata for CRUD (+show) operations
 * Non-CRUD operations must be a part of migration (transaction), so they're skipped here
 * @param sqlString - SQL query
 * @returns {{sqlOperationName: string | undefined, tableName: string | undefined}}
 */
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
    const sqlOperationName = get(ast, 'type')

    if (!SUPPORTED_PG_OPERATIONS.has(sqlOperationName)) {
        logger.error({ msg: 'Unsupported operation provided', sqlQuery: sqlString, sqlOperationName: sqlOperationName })
        throw new Error(
            'Unsupported operation provided. ' +
            `Expected to be one of the following: [${[...SUPPORTED_PG_OPERATIONS].join(', ')}], ` +
            `but got: ${sqlOperationName}`
        )
    }

    let tableName = undefined

    if (sqlOperationName === 'select' || sqlOperationName === 'delete') {
        tableName = _extractTableByFromArgument(sqlString, ast)
    } else if (sqlOperationName === 'insert' || sqlOperationName === 'update') {
        tableName = _extractTableByTableArgument(sqlString, ast)
    }

    return { sqlOperationName, tableName }
}

function getFkJoinMetadata (sqlString) {
    if (!sqlString || typeof sqlString !== 'string') return null

    const baseMatch = sqlString.match(/from\s+"[^"]+"\."([^"]+)"\s+as\s+"([^"]+)"/i)
    if (!baseMatch) return null
    const [, baseTable, baseAlias] = baseMatch

    const joinRe = /left\s+outer\s+join\s+"[^"]+"\."([^"]+)"\s+as\s+"([^"]+)"\s+on\s+"\2"\."id"\s*=\s*"([^"]+)"\."([^"]+)"/ig
    const joins = []
    let joinMatch = null
    while ((joinMatch = joinRe.exec(sqlString)) !== null) {
        const [, joinTable, alias, sourceAlias, sourceField] = joinMatch
        if (sourceAlias !== baseAlias) continue
        joins.push({
            alias,
            joinTable: _normalizeTableName(joinTable),
            sourceAlias,
            sourceField,
            fkExpression: `"${sourceAlias}"."${sourceField}"`,
        })
    }

    return {
        baseTable: _normalizeTableName(baseTable),
        baseAlias,
        joins,
    }
}

module.exports = {
    SUPPORTED_PG_OPERATIONS,
    extractCRUDQueryData,
    getFkJoinMetadata,
}