
const { getItems } = require('@keystonejs/server-side-graphql-client')
const { getSchemaCtx } = require('@core/keystone/schema')
const GLOBAL_QUERY_LIMIT = 1000

// When we load models with Apollo graphql - every relation on a field for every object makes sql request
// For example, loading 50 tickets will cause a result of ~1000 sql gueries which is near server limit
// But we want to keep sortBy and where functionality from gql
// What we do:
// 1. We use gql to load fields from main table with sort and where
// 2. We use knex to load all relations in one sql request for ids in 1.
// 3. We can use aggregate functions from knex on multiple relation fields
// 4. We merge 1 and 2
// 5. We load all data by chunks (size of chunk is equal to global guery sql limit)
// It's about ~4.5 times faster then using only gql queries
// Tested on tickets export for 24755 tickets: without knex  71220.902ms, with knex: 16094.841ms )
// TODO(zuch): find out how to make 1 request for 1. and 2.

class GqlWithKnexLoadList {

    constructor ({ listKey, fields, singleRelations = [], multipleRelations = [], where = {}, sortBy = [] }) {
        if (!Reflect.has(where, 'deletedAt')) {
            where.deletedAt = null
        }
        this.listKey = listKey
        this.fields = fields
        this.where = where
        this.sortBy = sortBy
        this.singleRelations = singleRelations
        this.multipleRelations = multipleRelations
    }

    async load () {
        const { keystone: modelAdapter } = await getSchemaCtx(this.listKey)
        this.keystone = modelAdapter
        this.knex = modelAdapter.adapter.knex
        let skip = 0
        let newchunk = []
        let all = []
        let maxiterationsCount = 100 // we need some limits - 100K records is more then enough
        do {
            newchunk = await this.loadChunk(skip)
            all = all.concat(newchunk)
            skip += newchunk.length
            if (newchunk.length < GLOBAL_QUERY_LIMIT) {
                break
            }
        } while (--maxiterationsCount > 0 && newchunk.length)
        return all
    }

    async loadChunk (skip = 0) {
        const mainTableObjects = await getItems({
            keystone: this.keystone,
            listKey: this.listKey,
            where: this.where,
            sortBy: this.sortBy,
            skip: skip,
            first: GLOBAL_QUERY_LIMIT,
            returnFields: this.fields,
        })
        if (mainTableObjects.length === 0) {
            return []
        }
        const ids = mainTableObjects.map(object => object.id)
        const knexQuery = this.knex(`${this.listKey} as mainModel`)
        knexQuery.select('mainModel.id')
        if (this.multipleRelations.length !== 0) {
            knexQuery.groupBy('mainModel.id')
        }
        this.singleRelations.forEach(([ Model, fieldName, value, alias ], idx) => {
            knexQuery.select(`sr${idx}.${value} as ${alias || fieldName}`)
            if (this.multipleRelations.length !== 0) {
                knexQuery.groupBy(`sr${idx}.${value}`)
            }
            knexQuery.leftJoin(`${Model} as sr${idx}`, `sr${idx}.id`, `mainModel.${fieldName}`)
        })
        this.multipleRelations.forEach(([select, join], idx) => {
            knexQuery.select(select(idx, this.knex))
            knexQuery.leftJoin(...join(idx))
        })
        knexQuery.whereIn('mainModel.id', ids)
        const joinTablesObjects = await knexQuery
        const main = Object.fromEntries(mainTableObjects.map(object => ([object.id, object])))
        const joins = Object.fromEntries(joinTablesObjects.map(object => ([object.id, object])))
        const merged = {}
        for (const id in main) {
            merged[id] = { ...main[id], ...joins[id] }
        }
        return Object.values(merged)
    }
}
// Simple way to load all models
const loadListByChunks = async ({
    context,
    list,
    where = {},
    sortBy = ['createdAt_ASC'],
    chunkSize = 100,
    limit = 100000,
}) => {
    let skip = 0
    let maxiterationsCount = Math.ceil(limit / chunkSize)
    let newchunk = []
    let all = []
    do {
        newchunk = await list.getAll(context, where, { sortBy, first: chunkSize, skip: skip })
        all = all.concat(newchunk)
        skip += newchunk.length
    } while (--maxiterationsCount > 0 && newchunk.length)
    return all
}


module.exports = {
    GqlWithKnexLoadList,
    loadListByChunks,
}
