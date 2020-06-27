/**
 * @jest-environment node
 */

const { makeClient, gql, setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const APP_VERSION_QUERY = gql`
    query {
        appVersion
    }
`

test('GQL API is healthy', async () => {
    const client = await makeClient()
    const { data } = await client.query(APP_VERSION_QUERY)
    expect(data).toEqual({ 'appVersion': '1.0.0' })
})
