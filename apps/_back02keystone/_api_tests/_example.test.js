/**
 * @jest-environment node
 */

const { makeClient, gql, setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const FIELDS = 'id v text'
const APP_TEST_OBJS_QUERY = gql`
    query {
        objs: allTests { ${FIELDS} }
    }
`

const CREATE_TEST_OBJ_MUTATION = gql`
    mutation createTest($data: TestCreateInput) {
        obj: createTest(data: $data) { ${FIELDS} }
    }
`
const UPDATE_TEST_OBJ_MUTATION = gql`
    mutation updateTest($id:ID!, $data: TestUpdateInput!) {
        obj: updateTest(id: $id, data: $data) { ${FIELDS} }
    }
`

async function createTestObj (client, attrs = {}) {
    const { data, errors } = await client.mutate(CREATE_TEST_OBJ_MUTATION, {
        data: { ...attrs },
    })
    expect(errors).toEqual(undefined)
    return data.obj
}

async function updateTestObj (client, obj, attrs = {}) {
    const { data, errors } = await client.mutate(UPDATE_TEST_OBJ_MUTATION, {
        id: obj.id,
        data: { ...attrs },
    })
    expect(errors).toEqual(undefined)
    return data.obj
}

test('versioning(): check v field autoincrement', async () => {
    const client = await makeClient()

    let obj = await createTestObj(client, {})
    expect(obj.v).toBe(1)

    obj = await updateTestObj(client, obj, {text: 'hello'})
    expect(obj.v).toBe(2)
})

