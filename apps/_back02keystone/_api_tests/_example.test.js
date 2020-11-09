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

const FIELDS = '{ id v text }'
const HISTORY_FIELDS = '{ id v text history_id history_action history_date }'
const GET_ALL_TEST_HISTORY_OBJS_QUERY = genGetAllGQL('TestHistoryRecord', 'TestHistoryRecords', HISTORY_FIELDS)

const CREATE_TEST_OBJ_MUTATION = gql`
    mutation createTest($data: TestCreateInput) {
        obj: createTest(data: $data) ${FIELDS}
    }
`
const UPDATE_TEST_OBJ_MUTATION = gql`
    mutation updateTest($id:ID!, $data: TestUpdateInput!) {
        obj: updateTest(id: $id, data: $data) ${FIELDS}
    }
`
const DELETE_TEST_OBJ_MUTATION = gql`
    mutation deleteTest($id:ID!) {
        obj: deleteTest(id: $id) ${FIELDS}
    }
`

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

async function getTestHistoryObjs (client, history_id) {
    const { data, errors } = await client.query(GET_ALL_TEST_HISTORY_OBJS_QUERY, { where: { history_id } })
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
})
