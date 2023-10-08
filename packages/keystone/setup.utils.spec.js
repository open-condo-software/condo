const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { MongooseAdapter } = require('@keystonejs/adapter-mongoose')

const { getAdapter, getCookieSecret } = require('./setup.utils')

describe('getAdapter()', () => {
    test('Mongo url', () => {
        const adapter = getAdapter('mongodb://mongo:mongo@127.0.0.1/main?authSource=admin')
        expect(adapter).toBeInstanceOf(MongooseAdapter)
    })

    test('Postgres url', () => {
        const adapter = getAdapter('postgresql://postgres:postgres@127.0.0.1/main')
        expect(adapter).toBeInstanceOf(KnexAdapter)
    })

    test('undefined', () => {
        const adapter = getAdapter('undefined')
        expect(adapter).not.toBeUndefined()
    })
})

describe('getCookieSecret()', () => {
    test('case 1', () => {
        const adapter = getCookieSecret('awfafawfawfmongawfmongo@127.0awf1/awfin?fthSoafrce=admin')
        expect(adapter).toEqual('awfafawfawfmongawfmongo@127.0awf1/awfin?fthSoafrce=admin')
    })

    test('short case', () => {
        const adapter = getCookieSecret('q122')
        expect(adapter).toEqual('445a5981-c27f-5f08-8284-bc38de8c1f4d')
    })

    test('undefined case', () => {
        const adapter = getCookieSecret('undefined')
        expect(adapter).toMatch(/^[a-z0-9-]{36}$/)
    })
})
