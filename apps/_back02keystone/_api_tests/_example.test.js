/**
 * @jest-environment node
 */

const { makeClient, gql, setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))
const faker = require('faker')
const { isMongo } = require('@core/keystone/test.utils')

function genGetAllGQL (MODEL, MODELs, MODEL_FIELDS) {
    return gql`
        query getAll${MODELs}($where: ${MODEL}WhereInput, $first: Int, $skip: Int) {
            objs: all${MODELs}(where: $where, first: $first, skip: $skip) ${MODEL_FIELDS}
        }
    `
}

function genCreateGQL (MODEL, MODELs, MODEL_FIELDS) {
    return gql`
        mutation create${MODEL}($data: ${MODEL}CreateInput) {
            obj: create${MODEL}(data: $data) ${MODEL_FIELDS}
        }
    `
}

function genUpdateGQL (MODEL, MODELs, MODEL_FIELDS) {
    return gql`
        mutation update${MODEL}($id: ID!, $data: ${MODEL}UpdateInput) {
            obj: update${MODEL}(id: $id, data: $data) ${MODEL_FIELDS}
        }
    `
}

function genDeleteGQL (MODEL, MODELs, MODEL_FIELDS) {
    return gql`
        mutation delete${MODEL}($id: ID!) {
            obj: delete${MODEL}(id: $id) ${MODEL_FIELDS}
        }
    `
}

const FIELDS = '{ id v text meta }'
const ITEM_FIELDS = `{ id v meta test ${FIELDS} }`
const HISTORY_FIELDS = '{ id v text history_id history_action history_date }'
const ITEM_HISTORY_FIELDS = '{ id v meta test history_id history_action history_date }'
const GET_ALL_TEST_OBJS_QUERY = genGetAllGQL('Test', 'Tests', FIELDS)
const GET_ALL_TEST_HISTORY_OBJS_QUERY = genGetAllGQL('TestHistoryRecord', 'TestHistoryRecords', HISTORY_FIELDS)
const GET_ALL_TEST_ITEM_HISTORY_OBJS_QUERY = genGetAllGQL('TestItemHistoryRecord', 'TestItemHistoryRecords', ITEM_HISTORY_FIELDS)
const CREATE_TEST_ITEM_OBJ_MUTATION = genCreateGQL('TestItem', 'TestItems', ITEM_FIELDS)
const UPDATE_TEST_ITEM_OBJ_MUTATION = genUpdateGQL('TestItem', 'TestItems', ITEM_FIELDS)
const DELETE_TEST_ITEM_OBJ_MUTATION = genDeleteGQL('TestItem', 'TestItems', ITEM_FIELDS)
const CREATE_TEST_OBJ_MUTATION = genCreateGQL('Test', 'Tests', FIELDS)
const UPDATE_TEST_OBJ_MUTATION = genUpdateGQL('Test', 'Tests', FIELDS)
const DELETE_TEST_OBJ_MUTATION = genDeleteGQL('Test', 'Tests', FIELDS)

async function createTestObj (client, attrs = {}) {
    const { data, errors } = await client.mutate(CREATE_TEST_OBJ_MUTATION, {
        data: { ...attrs },
    })
    expect(errors).toEqual(undefined)
    return data.obj
}

async function updateTestObj (client, id, attrs = {}) {
    const { data, errors } = await client.mutate(UPDATE_TEST_OBJ_MUTATION, {
        id, data: { ...attrs },
    })
    expect(errors).toEqual(undefined)
    return data.obj
}

async function deleteTestObj (client, id) {
    const { data, errors } = await client.mutate(DELETE_TEST_OBJ_MUTATION, { id })
    expect(errors).toEqual(undefined)
    return data.obj
}

async function createTestItemObj (client, attrs = {}) {
    const { data, errors } = await client.mutate(CREATE_TEST_ITEM_OBJ_MUTATION, {
        data: { ...attrs },
    })
    expect(errors).toEqual(undefined)
    return data.obj
}

async function updateTestItemObj (client, id, attrs = {}) {
    const { data, errors } = await client.mutate(UPDATE_TEST_ITEM_OBJ_MUTATION, {
        id, data: { ...attrs },
    })
    expect(errors).toEqual(undefined)
    return data.obj
}

async function deleteTestItemObj (client, id) {
    const { data, errors } = await client.mutate(DELETE_TEST_ITEM_OBJ_MUTATION, { id })
    expect(errors).toEqual(undefined)
    return data.obj
}

async function getTestObjs (client, where) {
    const { data, errors } = await client.query(GET_ALL_TEST_OBJS_QUERY, { where: where })
    expect(errors).toEqual(undefined)
    return data.objs
}

async function getTestHistoryObjs (client, history_id) {
    const { data, errors } = await client.query(GET_ALL_TEST_HISTORY_OBJS_QUERY, { where: { history_id } })
    expect(errors).toEqual(undefined)
    return data.objs
}

async function getTestItemHistoryObjs (client, history_id) {
    const { data, errors } = await client.query(GET_ALL_TEST_ITEM_HISTORY_OBJS_QUERY, { where: { history_id } })
    expect(errors).toEqual(undefined)
    return data.objs
}

describe('Json field', () => {
    async function testJsonValue (value) {
        const client = await makeClient()
        let obj = await createTestObj(client, { meta: value })
        expect(obj.meta).toStrictEqual(value)
    }

    test('object as value', async () => {
        await testJsonValue({ foo: 'foo', bar: 2, buz: false, no: null, yes: true })
    })
    test('object with array as value', async () => {
        await testJsonValue({
            foo: ['foo', 1, 33.3],
            bar: 2,
            buz: false,
            no: [null, false],
            yes: true,
            e1: [],
            e2: {},
        })
    })
    test('{} as value', async () => {
        await testJsonValue({})
    })
    test('null as value', async () => {
        await testJsonValue(null)
    })
    test('true as value', async () => {
        await testJsonValue(true)
    })
    test('false as value', async () => {
        await testJsonValue(false)
    })
    test('"" as value', async () => {
        await testJsonValue('')
    })
    test('[] as value', async () => {
        await testJsonValue([])
    })
    test('0 as value', async () => {
        await testJsonValue(0)
    })
    test('{"":[{}]} as value', async () => {
        await testJsonValue({ '': [{}] })
        await testJsonValue({ '': [{ '': [{}] }] })
    })
    test('number as value', async () => {
        await testJsonValue(faker.random.number())
        await testJsonValue(faker.random.float())
    })
    test('string as value', async () => {
        await testJsonValue(faker.internet.email())
        await testJsonValue(JSON.stringify(JSON.stringify(faker.internet.email())))
        await testJsonValue('\'')
        await testJsonValue('"')
        await testJsonValue('--')
        await testJsonValue('%')
        await testJsonValue('~')
        await testJsonValue('~~')
    })
    test('array as value', async () => {
        await testJsonValue(faker.random.arrayElements())
    })
})

describe('Json field exact match filter', () => {
    async function testFilterByValue (value, metaSuffix = '') {
        const client = await makeClient()
        const obj = await createTestObj(client, { meta: value })
        const objs = await getTestObjs(client, { ['meta' + metaSuffix]: value })
        const objsIds = objs.map(x => x.id)
        const objsMetas = [...(new Set(objs.map(x => JSON.stringify(x.meta))))].map(JSON.parse)
        expect(objsIds).toContain(obj.id)
        expect(objsMetas).toStrictEqual([value])
    }

    test('object as value', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: need a custom query parser!')

        await testFilterByValue({ foo: 'foo', bar: 2, buz: false, no: null, yes: true })
        // await testFilterByValue({ foo: 'foo', bar: 2, buz: false, no: null, yes: true }, '_in') // ok
    })
    test('object with array as value', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: need a custom query parser!')

        await testFilterByValue({
            foo: ['foo', 1, 33.3],
            bar: 2,
            buz: false,
            no: [null, false],
            yes: true,
            e1: [],
            e2: {},
        })
        // await testFilterByValue({
        //         foo: ['foo', 1, 33.3],
        //         bar: 2,
        //         buz: false,
        //         no: [null, false],
        //         yes: true,
        //         e1: [],
        //         e2: {},
        //     },
        //     '_in',
        // ) // ok
    })
    test('{} as value', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: {} === null!')

        await testFilterByValue({})
        // await testFilterByValue({}, '_in') // ok
    })
    test('null as value', async () => {
        await testFilterByValue(null)
        // await testFilterByValue(null, '_in') // err
    })
    test('true as value', async () => {
        await testFilterByValue(true)
        // await testFilterByValue(true, '_in') // err
    })
    test('false as value', async () => {
        await testFilterByValue(false)
        // await testFilterByValue(false, '_in') // ok
    })
    test('by ""', async () => {
        await testFilterByValue('')
        // await testFilterByValue('', '_in') // ok
    })
    test('by []', async () => {
        await testFilterByValue([])
        // await testFilterByValue([], '_in') // err
    })
    test('by 0', async () => {
        await testFilterByValue(0)
    })
    test('by {"":[{}]}', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: {} === null!')

        await testFilterByValue({ '': [{}] })
        await testFilterByValue({ '': [{ '': [{}] }] })
    })
    test('by number', async () => {
        await testFilterByValue(faker.random.number())
        await testFilterByValue(faker.random.float())
    })
    test('by string', async () => {
        await testFilterByValue(faker.internet.email())
        await testFilterByValue(JSON.stringify(JSON.stringify(faker.internet.email())))
        await testFilterByValue('\'')
        await testFilterByValue('"')
        await testFilterByValue('--')
        await testFilterByValue('%')
        await testFilterByValue('~')
        await testFilterByValue('~~')
    })
    test('by array', async () => {
        await testFilterByValue(faker.random.arrayElements())
    })
})

describe('versioning()', () => {
    test('check v field autoincrement', async () => {
        const client = await makeClient()

        let obj = await createTestObj(client, {})
        expect(obj.v).toBe(1)

        obj = await updateTestObj(client, obj.id, { text: 'hello' })
        expect(obj.v).toBe(2)
    })
})

describe('historical()', () => {
    test('create/update/delete history', async () => {
        const client = await makeClient()
        let obj = await createTestObj(client, {})
        await updateTestObj(client, obj.id, { text: 'hello' })
        await updateTestObj(client, obj.id, { text: 'no' })
        await deleteTestObj(client, obj.id)

        let histObjs = await getTestHistoryObjs(client, obj.id)
        expect(histObjs).toEqual([
            expect.objectContaining({ history_action: 'c', history_id: obj.id, text: null, v: 1 }),
            expect.objectContaining({ history_action: 'u', history_id: obj.id, text: 'hello', v: 2 }),
            expect.objectContaining({ history_action: 'u', history_id: obj.id, text: 'no', v: 3 }),
            expect.objectContaining({ history_action: 'd', history_id: obj.id, text: 'no', v: 3 }),
        ])
    })

    test('delete related object and set FK null without history update', async () => {
        const client = await makeClient()
        let obj = await createTestItemObj(client, { test: { create: { text: 'new1' } }, meta: { foo: 1 } })
        await updateTestItemObj(client, obj.id, { meta: { foo: 2 } })
        await updateTestObj(client, obj.test.id, { text: 'new2' })
        await deleteTestObj(client, obj.test.id)
        await deleteTestItemObj(client, obj.id)

        let histObjs = await getTestHistoryObjs(client, obj.test.id)
        expect(histObjs).toEqual([
            expect.objectContaining({ history_action: 'c', history_id: obj.test.id, text: 'new1', v: 1 }),
            expect.objectContaining({ history_action: 'u', history_id: obj.test.id, text: 'new2', v: 2 }),
            expect.objectContaining({ history_action: 'd', history_id: obj.test.id, text: 'new2', v: 2 }),
        ])

        histObjs = await getTestItemHistoryObjs(client, obj.id)
        expect(histObjs).toEqual([
            expect.objectContaining({
                history_action: 'c',
                history_id: obj.id,
                meta: { foo: 1 },
                v: 1,
                test: String(obj.test.id),
            }),
            expect.objectContaining({
                history_action: 'u',
                history_id: obj.id,
                meta: { foo: 2 },
                v: 2,
                test: String(obj.test.id),
            }),
            expect.objectContaining({
                history_action: 'd',
                history_id: obj.id,
                meta: { foo: 2 },
                v: 2,
                test: null,
            }),
        ])
    })
})

describe('uuiding()', () => {
    test('auto generating', async () => {
        const client = await makeClient()
        let obj = await createTestItemObj(client, { test: { create: { text: 'autoGen' } } })
        expect(obj.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
})
