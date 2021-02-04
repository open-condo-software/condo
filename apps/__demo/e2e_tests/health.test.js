/**
 * @jest-environment node
 */

const conf = require('@core/config')
const { setFakeClientMode } = require('@core/keystone/test.utils')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const { gql } = require('@core/keystone/test.utils')
const { makeClient } = require('@core/keystone/test.utils')

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
