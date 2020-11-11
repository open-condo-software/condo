/**
 * @jest-environment node
 */

const { makeClient, gql, setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

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

const FIELDS = '{ id v text }'
const ITEM_FIELDS = `{ id v meta test ${FIELDS} }`
const HISTORY_FIELDS = '{ id v text history_id history_action history_date }'
const ITEM_HISTORY_FIELDS = '{ id v meta test history_id history_action history_date }'
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
            expect.objectContaining({ history_action: 'c', history_id: obj.id, meta: { foo: 1 }, v: 1, test: String(obj.test.id) }),
            expect.objectContaining({ history_action: 'u', history_id: obj.id, meta: { foo: 2 }, v: 2, test: String(obj.test.id) }),
            expect.objectContaining({ history_action: 'd', history_id: obj.id, meta: { foo: 2 }, v: 2, test: null }),
        ])
    })
})

describe('uuiding()', () => {
    test('auto generating', async () => {
        const client = await makeClient()
        let obj = await createTestObj(client, { item: { create: {} } })
    })
})
