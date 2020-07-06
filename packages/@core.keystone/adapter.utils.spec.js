const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { MongooseAdapter } = require('@keystonejs/adapter-mongoose')
const { getAdapter } = require('./adapter.utils')

test('getAdapter() Mongo url', () => {
    const adapter = getAdapter('mongodb://mongo:mongo@127.0.0.1/main?authSource=admin')
    expect(adapter).toBeInstanceOf(MongooseAdapter)
})

test('getAdapter() Postgres url', () => {
    const adapter = getAdapter('postgresql://postgres:postgres@127.0.0.1/main')
    expect(adapter).toBeInstanceOf(KnexAdapter)
})

test('getAdapter() undefined', () => {
    const adapter = getAdapter('undefined')
    expect(adapter).not.toBeUndefined()
})
