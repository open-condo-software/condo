/**
 * @jest-environment node
 */

const { setFakeClientMode, makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const faker = require('faker')
const { BillingIntegration } = require('./Billing.gql')

async function createBillingIntegration (client, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    const name = faker.company.companyName()

    const attrs = {
        dv: 1,
        name,
        ...extraAttrs,
    }
    const obj = await BillingIntegration.create(client, attrs)
    return [obj, attrs]
}

describe('BillingIntegration', () => {
    test('admin: createBillingIntegration', async () => {
        const admin = await makeLoggedInAdminClient()
        const [integration, attrs] = await createBillingIntegration(admin)
        expect(integration).toEqual(expect.objectContaining({
            name: attrs.name,
        }))
    })
})
