const { GraphQLApp } = require('@keystonejs/app-graphql')
const { getItems } = require('@keystonejs/server-side-graphql-client')
const { getSchemaCtx } = require('@core/keystone/schema')
const path = require('path')


process.env.DEBUG = 'knex:query,knex:tx'

const GLOBAL_QUERY_LIMIT = 1000

class GqlToKnex {

    constructor ({ listKey, fields, singleRelations = [], multipleRelations = [], where = {}, sortBy = [] }) {
        this.listKey = listKey
        this.fields = fields
        this.where = where
        this.sortBy = sortBy
        this.singleRelations = singleRelations
        this.multipleRelations = multipleRelations
    }

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.keystone = keystone
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async loadMainModel () {
        console.time('START')
        const objects = await getItems({
            keystone: this.keystone,
            listKey: this.listKey,
            where: this.where,
            context: this.context,
            sortBy: this.sortBy,
            first: GLOBAL_QUERY_LIMIT,
            returnFields: this.fields,
        })
        const ids = objects.map(object => object.id)
        const { keystone: modelAdapter } = await getSchemaCtx('Ticket')
        const knex = modelAdapter.adapter.knex

        const query = knex(`${this.listKey} as mainModel`)
        query.select('mainModel.id')
        query.groupBy('mainModel.id')
        this.singleRelations.forEach(([ Model, fieldName, value ], idx) => {
            query.select(`sr${idx}.${value} as ${fieldName}`)
            query.groupBy(`sr${idx}.${value}`)
            query.leftJoin(`${Model} as sr${idx}`, `sr${idx}.id`, `mainModel.${fieldName}`)
        })
        // Todo: multiple relations works badly
        this.multipleRelations.forEach(([Model, fieldName, value], idx) => {
            query.select(knex.raw(`ARRAY_AGG(mr${idx}.${value}) as ${Model}`))
            query.leftJoin(`${Model} as mr${idx}`, `mr${idx}.${fieldName}`, 'mainModel.id')
        })
        query.whereIn('mainModel.id', ids)
        const result = await query
        console.log('result', result)
        console.timeEnd('START')
    }

    async generate () {
        await this.loadMainModel()
    }

    async queryFields () {
        console.log('knex is comming!')
    }

}

const createQuery = async () => {
    const converter = new GqlToKnex({
        listKey: 'Ticket',
        fields: 'id number unitName sectionName floorName clientName clientPhone isEmergency isPaid details createdAt updatedAt',
        singleRelations: [
            ['User', 'createdBy', 'name'],
            ['User', 'operator', 'name'],
            ['User', 'executor', 'name'],
            ['User', 'assignee', 'name'],
            ['TicketPlaceClassifier', 'placeClassifier', 'name'],
            ['TicketCategoryClassifier', 'categoryClassifier', 'name'],
            ['TicketProblemClassifier', 'problemClassifier', 'name'],
            ['Organization', 'organization', 'name'],
            ['Property', 'property', 'address'],
        ],
        multipleRelations: [
            ['TicketComment', 'ticket', 'content'],
            ['TicketChange', 'ticket', 'id'],
        ],
        sortBy: ['number_ASC'],
        where: { id: '710f9f85-a9b9-4213-9a82-c17b53954521', organization: { id: 'bcb217d4-0c37-41a7-877e-b458b30f62d7' } }, //, AND: [{ number: 500 }]
    })
    await converter.connect()
    await converter.generate()
    await converter.queryFields()
}


createQuery().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error('Failed to done', err)
})
