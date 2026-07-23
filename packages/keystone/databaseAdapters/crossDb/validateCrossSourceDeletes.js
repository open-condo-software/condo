/**
 * Cross-database inbound FK enforcement on DELETE / soft-delete.
 *
 * Physical FKs cannot span Postgres databases. After moved tables drop inbound
 * constraints on main, this module restores PROTECT / CASCADE / SET_NULL using
 * Keystone `kmigratorOptions.on_delete` metadata.
 *
 * Soft-delete (`UPDATE deletedAt`) only enforces PROTECT — matching single-DB
 * Postgres, which does not run ON DELETE actions on UPDATE.
 */
const { Parser } = require('node-sql-parser/build/postgresql')

const {
    normalizeColumnName,
    normalizePositionalBindings,
    resolveSqlValue,
} = require('./sqlAstUtils')

const parser = new Parser()

const ON_DELETE = {
    PROTECT: 'PROTECT',
    CASCADE: 'CASCADE',
    SET_NULL: 'SET_NULL',
    DO_NOTHING: 'DO_NOTHING',
}

/**
 * @param {string|undefined|null} raw kmigrator `on_delete` (e.g. `models.SET_NULL`)
 * @returns {string} one of {@link ON_DELETE}
 */
function normalizeOnDelete (raw) {
    const value = String(raw || '').toUpperCase()
    if (value.includes('PROTECT') || value.includes('RESTRICT')) return ON_DELETE.PROTECT
    if (value.includes('CASCADE')) return ON_DELETE.CASCADE
    if (value.includes('SET_NULL')) return ON_DELETE.SET_NULL
    if (value.includes('DO_NOTHING') || value.includes('SET_DEFAULT')) return ON_DELETE.DO_NOTHING
    // Condo lint requires on_delete on relations; missing → safest default
    return ON_DELETE.PROTECT
}

/**
 * @param {object|null} listAdapter
 * @returns {Array}
 */
function _iterFieldAdapters (listAdapter) {
    if (listAdapter?.fieldAdapters?.length) return listAdapter.fieldAdapters
    if (listAdapter?.fieldAdaptersByPath) return Object.values(listAdapter.fieldAdaptersByPath)
    return []
}

/**
 * @param {object|null} listAdapter
 * @returns {boolean}
 */
function _listHasSoftDelete (listAdapter) {
    return _iterFieldAdapters(listAdapter).some(field => field.path === 'deletedAt')
}

/**
 * Relationship fields on other lists that store an FK column pointing at `listKey`,
 * where the dependent list lives on a different pool than `listKey`.
 *
 * @param {{ listKey: string, listAdapters: Record<string, object>, sourceRegistry: object }} options
 * @returns {Array<{ dependentListKey: string, columnName: string, onDelete: string, fieldPath: string }>}
 */
function collectCrossSourceInboundForeignKeys ({ listKey, listAdapters, sourceRegistry }) {
    const parentSource = sourceRegistry.resolveSource(listKey)
    const result = []

    for (const [dependentListKey, listAdapter] of Object.entries(listAdapters || {})) {
        if (dependentListKey === listKey) continue
        if (sourceRegistry.resolveSource(dependentListKey) === parentSource) continue

        for (const fieldAdapter of _iterFieldAdapters(listAdapter)) {
            if (!fieldAdapter.isRelationship || fieldAdapter.refListKey !== listKey) continue

            // Skip N:N / FK-not-on-this-table for v1
            const fkTable = fieldAdapter.rel?.tableName
            if (fkTable && fkTable !== dependentListKey) continue

            const columnName = fieldAdapter.rel?.columnName || fieldAdapter.path
            if (!columnName) continue

            result.push({
                dependentListKey,
                columnName,
                fieldPath: fieldAdapter.path,
                onDelete: normalizeOnDelete(fieldAdapter.config?.kmigratorOptions?.on_delete),
            })
        }
    }

    return result
}

/**
 * @param {object|null} whereAst
 * @param {Array} bindings
 * @returns {string[]}
 */
function _extractIdsFromWhere (whereAst, bindings) {
    if (!whereAst) return []

    if (whereAst.type === 'binary_expr') {
        const operator = String(whereAst.operator || '').toUpperCase()
        if (operator === 'AND') {
            return [
                ..._extractIdsFromWhere(whereAst.left, bindings),
                ..._extractIdsFromWhere(whereAst.right, bindings),
            ]
        }

        const leftColumn = normalizeColumnName(whereAst.left)
        if (leftColumn !== 'id') return []

        if (operator === '=' || operator === '==') {
            const value = resolveSqlValue(whereAst.right, bindings)
            return value !== null && value !== undefined ? [value] : []
        }

        if (operator === 'IN') {
            const list = whereAst.right?.type === 'expr_list' ? whereAst.right.value : []
            return (list || [])
                .map(node => resolveSqlValue(node, bindings))
                .filter(value => value !== null && value !== undefined)
        }
    }

    return []
}

/**
 * @param {string} sql
 * @returns {object|null}
 */
function _parseSingleStatement (sql) {
    let ast = parser.astify(normalizePositionalBindings(sql))
    if (Array.isArray(ast)) {
        if (ast.length !== 1) return null
        ast = ast[0]
    }
    return ast || null
}

/**
 * Ids targeted by `DELETE FROM ... WHERE id = / IN (...)`.
 *
 * @param {string} sql
 * @param {Array} [bindings]
 * @returns {string[]}
 */
function extractDeleteTargetIds (sql, bindings = []) {
    const ast = _parseSingleStatement(sql)
    if (!ast || ast.type !== 'delete') return []
    return [...new Set(_extractIdsFromWhere(ast.where, bindings))]
}

/**
 * Whether an UPDATE sets `deletedAt` to a non-null value (condo soft-delete).
 *
 * @param {string} sql
 * @param {Array} [bindings]
 * @returns {boolean}
 */
function isSoftDeleteUpdate (sql, bindings = []) {
    const ast = _parseSingleStatement(sql)
    if (!ast || ast.type !== 'update') return false

    for (const item of ast.set || []) {
        const columnName = normalizeColumnName(item.column)
        if (columnName !== 'deletedAt') continue
        const value = resolveSqlValue(item.value, bindings)
        if (value !== null && value !== undefined) return true
    }
    return false
}

/**
 * Ids from UPDATE ... WHERE id = / IN (...).
 *
 * @param {string} sql
 * @param {Array} [bindings]
 * @returns {string[]}
 */
function extractUpdateTargetIds (sql, bindings = []) {
    const ast = _parseSingleStatement(sql)
    if (!ast || ast.type !== 'update') return []
    return [...new Set(_extractIdsFromWhere(ast.where, bindings))]
}

/**
 * @param {object} knexTable query builder for one table
 * @param {string} columnName
 * @param {string[]} parentIds
 * @param {boolean} hasSoftDelete
 * @returns {Promise<object[]>}
 */
async function _findDependents (knexTable, columnName, parentIds, hasSoftDelete) {
    let query = knexTable.select('id').whereIn(columnName, parentIds)
    if (hasSoftDelete) {
        query = query.whereNull('deletedAt')
    }
    return query
}

/**
 * Enforce inbound cross-source FK rules for a parent row delete / soft-delete.
 *
 * @param {object} options
 * @param {string} options.tableName parent table being deleted
 * @param {Record<string, object>} options.listAdapters
 * @param {string} options.sql
 * @param {Array} [options.bindings]
 * @param {string} options.sqlOperationName
 * @param {object} options.sourceRegistry
 * @param {(poolName: string) => object} options.getPoolByName
 * @returns {Promise<void>}
 */
async function enforceCrossSourceDeleteConstraints ({
    tableName,
    listAdapters,
    sql,
    bindings = [],
    sqlOperationName,
    sourceRegistry,
    getPoolByName,
}) {
    let mode = null
    let parentIds = []

    if (sqlOperationName === 'delete') {
        mode = 'hard'
        parentIds = extractDeleteTargetIds(sql, bindings)
    } else if (sqlOperationName === 'update') {
        // Avoid SQL AST on ordinary updates (main-path hot).
        if (!/\b"?deletedAt"?\s*=/i.test(sql)) return
        if (!isSoftDeleteUpdate(sql, bindings)) return
        mode = 'soft'
        parentIds = extractUpdateTargetIds(sql, bindings)
    } else {
        return
    }

    if (!parentIds.length) return

    const inbound = collectCrossSourceInboundForeignKeys({
        listKey: tableName,
        listAdapters,
        sourceRegistry,
    })
    if (!inbound.length) return

    const protectRels = inbound.filter(rel => rel.onDelete === ON_DELETE.PROTECT)
    for (const rel of protectRels) {
        const poolName = sourceRegistry.resolveSource(rel.dependentListKey)
        const pool = getPoolByName(poolName)
        const client = pool.getKnexClient()
        const hasSoftDelete = _listHasSoftDelete(listAdapters[rel.dependentListKey])
        const dependents = await _findDependents(
            client(rel.dependentListKey),
            rel.columnName,
            parentIds,
            hasSoftDelete,
        )
        if (dependents.length > 0) {
            throw new Error(
                `Cross-database foreign key violation: cannot delete ${tableName} ` +
                `id(s) [${parentIds.join(', ')}] — protected by ${rel.dependentListKey}.${rel.columnName}`,
            )
        }
    }

    // Soft-delete does not run ON DELETE CASCADE / SET_NULL in Postgres either.
    if (mode === 'soft') return

    const cascadeRels = inbound.filter(rel => rel.onDelete === ON_DELETE.CASCADE)
    for (const rel of cascadeRels) {
        const poolName = sourceRegistry.resolveSource(rel.dependentListKey)
        const pool = getPoolByName(poolName)
        const client = pool.getKnexClient()
        const hasSoftDelete = _listHasSoftDelete(listAdapters[rel.dependentListKey])
        let query = client(rel.dependentListKey).whereIn(rel.columnName, parentIds)
        if (hasSoftDelete) query = query.whereNull('deletedAt')
        await query.del()
    }

    const setNullRels = inbound.filter(rel => rel.onDelete === ON_DELETE.SET_NULL)
    for (const rel of setNullRels) {
        const poolName = sourceRegistry.resolveSource(rel.dependentListKey)
        const pool = getPoolByName(poolName)
        const client = pool.getKnexClient()
        const hasSoftDelete = _listHasSoftDelete(listAdapters[rel.dependentListKey])
        let query = client(rel.dependentListKey).whereIn(rel.columnName, parentIds)
        if (hasSoftDelete) query = query.whereNull('deletedAt')
        await query.update({ [rel.columnName]: null })
    }
}

module.exports = {
    ON_DELETE,
    normalizeOnDelete,
    collectCrossSourceInboundForeignKeys,
    extractDeleteTargetIds,
    extractUpdateTargetIds,
    isSoftDeleteUpdate,
    enforceCrossSourceDeleteConstraints,
}
