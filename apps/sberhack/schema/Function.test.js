/**
 * @jest-environment node
 * @test-style 3
 */

const { setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))
const { makeLoggedInClient } = require('@core/keystone/test.utils')

const { Function } = require('./Function.gql')

async function createFunction (client, extraAttrs = {}) {
    const attrs = {
        owner: { connect: { id: 1 } },
        language: "Javascript",
        signature: "",
        description: "",
        body: "",
        ...extraAttrs,
    }
    const obj = await Function.create(client, attrs)
    return [obj, attrs]
}

test('create function by minimal fields', async () => {
    const client = await makeLoggedInClient()
    const [obj, attrs] = await createFunction(client)
    expect(obj.language).toMatch('Javascript')
})
