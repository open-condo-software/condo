/**
 * @jest-environment node
 */

const { makeClient, setFakeClientMode, gql } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const { getAllRegisteredSchemasNames } = require('@core/keystone/schema')
const { syncDatabasePermissionState } = require('@core/keystone/permissions/sync')


test('getAllRegisteredSchemasNames()', async () => {
    const res = await getAllRegisteredSchemasNames()
    expect(res).toContain('User')
    expect(res).toContain('Test')
})

test('syncDatabasePermissionState()', async () => {
    await syncDatabasePermissionState()
})

test('noname', async () => {
    const client = await makeLoggedInClient()

    const { data, errors } = await client.mutate(gql`
        mutation {
            testit(name: "no")
        }
    `)

    console.log(data, errors)
})
