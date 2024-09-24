const {
    KnexAdapter: BaseKnexAdapter, KnexListAdapter: BaseKnexListAdapter,
} = require('@keystonejs/adapter-knex')
const { escapeRegExp } = require('@keystonejs/utils')
const { get, isObject, isEmpty } = require('lodash')

class KnexAdapter extends BaseKnexAdapter {
    constructor ({ knexOptions = {}, schemaName = 'public' } = {}) {
        super(...arguments)
        this.listAdapterClass = KnexListAdapter
    }
}

class KnexListAdapter extends BaseKnexListAdapter {
    async _itemsQuery (args, { meta = false, from = {} } = {}) {
        const query = new QueryBuilder(this, args, { meta, from }).get()
        const results = await query

        if (meta) {
            const { first, skip } = args
            const ret = results[0]
            let count = ret.count

            // Adjust the count as appropriate
            if (skip !== undefined) {
                count -= skip
            }
            if (first !== undefined) {
                count = Math.min(count, first)
            }
            count = Math.max(0, count) // Don't want to go negative from a skip!
            return { count }
        }

        return results
    }
}

class QueryBuilder {
    constructor (listAdapter, { where = {}, first, skip, sortBy, orderBy, search }, { meta = false, from = {} }) {
        this._tableAliases = {}
        this._nextBaseTableAliasId = 0
        const baseTableAlias = this._getNextBaseTableAlias()
        this._query = listAdapter._query().from(`${listAdapter.tableName} as ${baseTableAlias}`)

        if (search) {
            console.log('Knex adapter does not currently support search!')
        }

        if (!meta) {
            // SELECT t0.* from <tableName> as t0
            this._query.column(`${baseTableAlias}.*`)
        }

        this._addJoins(this._query, listAdapter, where, baseTableAlias)

        // Joins/where to effectively translate us onto a different list
        if (Object.keys(from).length) {
            const a = from.fromList.adapter.fieldAdaptersByPath[from.fromField]
            const { cardinality, tableName, columnName } = a.rel
            const otherTableAlias = this._getNextBaseTableAlias()

            if (cardinality === 'N:N') {
                const { near, far } = from.fromList.adapter._getNearFar(a)
                this._query.leftOuterJoin(`${tableName} as ${otherTableAlias}`, `${otherTableAlias}.${far}`, `${baseTableAlias}.id`)
                this._query.whereRaw('true')
                this._query.andWhere(`${otherTableAlias}.${near}`, '=', from.fromId)
            } else {
                this._query.leftOuterJoin(`${tableName} as ${otherTableAlias}`, `${baseTableAlias}.${columnName}`, `${otherTableAlias}.id`)
                this._query.whereRaw('true')
                this._query.andWhere(`${baseTableAlias}.${columnName}`, '=', from.fromId)
            }
        } else {
            // Dumb sentinel to avoid juggling where() vs andWhere()
            // PG is smart enough to see it's a no-op, and now we can just keep chaining andWhere()
            this._query.whereRaw('true')
        }

        this._addWheres(w => this._query.andWhere(w), listAdapter, where, baseTableAlias)

        // TODO: Implement configurable search fields for lists
        const searchFieldName = listAdapter.config.searchField || 'name'
        const searchField = listAdapter.fieldAdaptersByPath[searchFieldName]
        if (search !== undefined && searchField) {
            if (searchField.fieldName === 'Text') {
                const f = escapeRegExp
                this._query.andWhere(`${baseTableAlias}.${searchFieldName}`, '~*', f(search))
            } else {
                this._query.whereRaw('false') // Return no results
            }
        }

        // Add query modifiers as required
        if (meta) {
            this._query = listAdapter.parentAdapter.knex
                .count('* as count')
                .from(this._query.as('unused_alias'))
        } else {
            if (first !== undefined) {
                // SELECT ... LIMIT <first>
                this._query.limit(first)
            }
            if (skip !== undefined) {
                // SELECT ... OFFSET <skip>
                this._query.offset(skip)
            }
            if (orderBy !== undefined) {
                // SELECT ... ORDER BY <orderField>
                const [orderField, orderDirection] = this._getOrderFieldAndDirection(orderBy)
                const sortKey = listAdapter.fieldAdaptersByPath[orderField].sortKey || orderField
                if (listAdapter.realKeys.includes(sortKey)) {
                    this._query.orderBy(sortKey, orderDirection)
                }
            }
            if (sortBy !== undefined) {
                // SELECT ... ORDER BY <orderField>[, <orderField>, ...]
                this._query.orderBy(sortBy
                    .map(s => {
                        const [orderField, orderDirection] = this._getOrderFieldAndDirection(s)
                        const sortKey = listAdapter.fieldAdaptersByPath[orderField].sortKey || orderField

                        if (listAdapter.realKeys.includes(sortKey)) {
                            return { column: sortKey, order: orderDirection }
                        } else {
                            return undefined
                        }
                    })
                    .filter(s => typeof s !== 'undefined'))
            }
        }
    }

    get () {
        return this._query
    }

    _getOrderFieldAndDirection (str) {
        const splits = str.split('_')
        const orderField = splits.slice(0, splits.length - 1).join('_')
        const orderDirection = splits[splits.length - 1]
        return [orderField, orderDirection]
    }

    _getNextBaseTableAlias () {
        const alias = `t${this._nextBaseTableAliasId++}`
        this._tableAliases[alias] = true
        return alias
    }

    _getQueryConditionByPath (listAdapter, path, tableAlias) {
        let dbPath = path
        let fieldAdapter = listAdapter.fieldAdaptersByPath[dbPath]

        while (!fieldAdapter && dbPath.includes('_')) {
            dbPath = dbPath.split('_').slice(0, -1).join('_')
            fieldAdapter = listAdapter.fieldAdaptersByPath[dbPath]
        }

        // Can't assume dbPath === fieldAdapter.dbPath (sometimes it isn't)
        return fieldAdapter && fieldAdapter.getQueryConditions(
            fieldAdapter.isRelationship
            && fieldAdapter.rel.cardinality === '1:1'
            && fieldAdapter.rel.right === fieldAdapter.field
                ? `${tableAlias}__${fieldAdapter.path}.id`
                : `${tableAlias}.${fieldAdapter.dbPath}`
        )[path]
    }

    _isGetRelationByIdCondition (where, path) {
        return isObject(get(where, [path])) && Object.keys(where[path]).length === 1 && !isEmpty(where[path].id)
    }

    // Recursively traverse the `where` query to identify required joins and add them to the query
    // We perform joins on non-many relationship fields which are mentioned in the where query.
    // Joins are performed as left outer joins on fromTable.fromCol to toTable.id
    _addJoins (query, listAdapter, where, tableAlias) {
        // Insert joins to handle 1:1 relationships where the FK is stored on the other table.
        // We join against the other table and select its ID as the path name, so that it appears
        // as if it existed on the primary table all along!

        const joinPaths = Object.keys(where)
            .filter(path => !this._isGetRelationByIdCondition(where, path))
            .filter(path => !this._getQueryConditionByPath(listAdapter, path))

        const joinedPaths = []
        listAdapter.fieldAdapters
            .filter(a => !this._isGetRelationByIdCondition(where, a.path))
            .filter(a => a.isRelationship && a.rel.cardinality === '1:1' && a.rel.right === a.field)
            .forEach(({ path, rel }) => {
                const { tableName, columnName } = rel
                const otherTableAlias = `${tableAlias}__${path}`
                if (!this._tableAliases[otherTableAlias]) {
                    this._tableAliases[otherTableAlias] = true
                    // LEFT OUTERJOIN on ... table>.<id> = <otherTable>.<columnName> SELECT <othertable>.<id> as <path>
                    query.leftOuterJoin(`${tableName} as ${otherTableAlias}`, `${otherTableAlias}.${columnName}`, `${tableAlias}.id`)
                    query.select(`${otherTableAlias}.id as ${path}`)
                    joinedPaths.push(path)
                }
            })

        for (let path of joinPaths) {
            if (path === 'AND' || path === 'OR') {
                // AND/OR we need to traverse their children
                where[path].forEach(x => this._addJoins(query, listAdapter, x, tableAlias))
            } else {
                const otherAdapter = listAdapter.fieldAdaptersByPath[path]
                // If no adapter is found, it must be a query of the form `foo_some`, `foo_every`, etc.
                // These correspond to many-relationships, which are handled separately
                if (otherAdapter && !joinedPaths.includes(path)) {
                    // We need a join of the form:
                    // ... LEFT OUTER JOIN {otherList} AS t1 ON {tableAlias}.{path} = t1.id
                    // Each table has a unique path to the root table via foreign keys
                    // This is used to give each table join a unique alias
                    // E.g., t0__fk1__fk2
                    const otherList = otherAdapter.refListKey
                    const otherListAdapter = listAdapter.getListAdapterByKey(otherList)
                    const otherTableAlias = `${tableAlias}__${path}`
                    if (!this._tableAliases[otherTableAlias]) {
                        this._tableAliases[otherTableAlias] = true
                        query.leftOuterJoin(`${otherListAdapter.tableName} as ${otherTableAlias}`, `${otherTableAlias}.id`, `${tableAlias}.${path}`)
                    }
                    this._addJoins(query, otherListAdapter, where[path], otherTableAlias)
                }
            }
        }
    }

    // Recursively traverses the `where` query and pushes knex query functions to whereJoiner,
    // which will normally do something like pass it to q.andWhere() to add to a query
    _addWheres (whereJoiner, listAdapter, where, tableAlias) {
        for (let path of Object.keys(where)) {
            const condition = this._getQueryConditionByPath(listAdapter, path, tableAlias)
            if (condition) {
                whereJoiner(condition(where[path]))
            } else if (path === 'AND' || path === 'OR') {
                whereJoiner(q => {
                    // AND/OR need to traverse both side of the query
                    let subJoiner
                    if (path == 'AND') {
                        q.whereRaw('true')
                        subJoiner = w => q.andWhere(w)
                    } else {
                        q.whereRaw('false')
                        subJoiner = w => q.orWhere(w)
                    }
                    where[path].forEach(subWhere => this._addWheres(subJoiner, listAdapter, subWhere, tableAlias))
                })
            } else if (this._isGetRelationByIdCondition(where, path)) {
                whereJoiner(q => q.where(`${tableAlias}.${path}`, where[path].id))
            } else {
                // We have a relationship field
                let fieldAdapter = listAdapter.fieldAdaptersByPath[path]
                if (fieldAdapter) {
                    // Non-many relationship. Traverse the sub-query, using the referenced list as a root.
                    const otherListAdapter = listAdapter.getListAdapterByKey(fieldAdapter.refListKey)
                    this._addWheres(whereJoiner, otherListAdapter, where[path], `${tableAlias}__${path}`)
                } else {
                    // Many relationship
                    const [p, constraintType] = path.split('_')
                    fieldAdapter = listAdapter.fieldAdaptersByPath[p]
                    const { rel } = fieldAdapter
                    const { cardinality, tableName, columnName } = rel
                    const subBaseTableAlias = this._getNextBaseTableAlias()
                    const otherList = fieldAdapter.refListKey
                    const otherListAdapter = listAdapter.getListAdapterByKey(otherList)
                    const subQuery = listAdapter._query()
                    let otherTableAlias
                    let selectCol
                    if (cardinality === '1:N' || cardinality === 'N:1') {
                        otherTableAlias = subBaseTableAlias
                        selectCol = columnName
                        subQuery
                            .select(`${subBaseTableAlias}.${selectCol}`)
                            .from(`${tableName} as ${subBaseTableAlias}`)
                        // We need to filter out nulls before passing back to the top level query
                        // otherwise postgres will give very incorrect answers.
                        subQuery.whereNotNull(`${subBaseTableAlias}.${columnName}`)
                    } else {
                        const { near, far } = listAdapter._getNearFar(fieldAdapter)
                        otherTableAlias = `${subBaseTableAlias}__${p}`
                        selectCol = near
                        subQuery
                            .select(`${subBaseTableAlias}.${selectCol}`)
                            .from(`${tableName} as ${subBaseTableAlias}`)
                        subQuery.innerJoin(`${otherListAdapter.tableName} as ${otherTableAlias}`, `${otherTableAlias}.id`, `${subBaseTableAlias}.${far}`)
                    }
                    this._addJoins(subQuery, otherListAdapter, where[path], otherTableAlias)

                    // some: the ID is in the examples found
                    // none: the ID is not in the examples found
                    // every: the ID is not in the counterexamples found
                    // FIXME: This works in a general and logical way, but doesn't always generate the queries that PG can best optimise
                    // 'some' queries would more efficient as inner joins

                    if (constraintType === 'every') {
                        subQuery.whereNot(q => {
                            q.whereRaw('true')
                            this._addWheres(w => q.andWhere(w), otherListAdapter, where[path], otherTableAlias)
                        })
                    } else {
                        subQuery.whereRaw('true')
                        this._addWheres(w => subQuery.andWhere(w), otherListAdapter, where[path], otherTableAlias)
                    }

                    // Ensure there therwhereIn/whereNotIn query is run against
                    // a table with exactly one column.
                    const subSubQuery = listAdapter.parentAdapter.knex
                        .select(selectCol)
                        .from(subQuery.as('unused_alias'))
                    if (constraintType === 'some') {
                        whereJoiner(q => q.whereIn(`${tableAlias}.id`, subSubQuery))
                    } else {
                        whereJoiner(q => q.whereNotIn(`${tableAlias}.id`, subSubQuery))
                    }
                }
            }
        }
    }
}

module.exports = {
    KnexAdapter,
}