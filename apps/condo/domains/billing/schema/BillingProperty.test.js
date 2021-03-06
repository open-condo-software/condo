/**
 * Generated by `createschema billing.BillingProperty 'context:Relationship:BillingIntegrationOrganizationContext:CASCADE; importId?:Text; bindingId:Text; address:Text; raw:Json; meta:Json'`
 */
const faker = require('faker')
const { makeContextWithOrganizationAndIntegrationAsAdmin } = require('@condo/domains/billing/utils/testSchema')
const { makeOrganizationIntegrationManager } = require('@condo/domains/billing/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { createTestBillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/testSchema')
const { makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const { BillingProperty, createTestBillingProperty, updateTestBillingProperty } = require('@condo/domains/billing/utils/testSchema')
const { expectToThrowAccessDeniedErrorToObj, expectToThrowAccessDeniedErrorToObjects } = require('@condo/domains/common/utils/testSchema')

describe('BillingProperty', () => {
    test('admin: create BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const [property, attrs] = await createTestBillingProperty(admin, context)
        expect(property.context.id).toEqual(attrs.context.connect.id)
    })

    test('user: create BillingProperty', async () => {
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const client = await makeClientWithNewRegisteredAndLoggedInUser()

        await expectToThrowAccessDeniedErrorToObj(async () => {
            await createTestBillingProperty(client, context)
        })
    })

    test('anonymous: create BillingProperty', async () => {
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const client = await makeClient()

        await expectToThrowAccessDeniedErrorToObj(async () => {
            await createTestBillingProperty(client, context)
        })
    })

    test('organization integration manager: create BillingProperty', async () => {
        const { organization, integration, managerUserClient } = await makeOrganizationIntegrationManager()
        const [context] = await createTestBillingIntegrationOrganizationContext(managerUserClient, organization, integration)
        const [property, attrs] = await createTestBillingProperty(managerUserClient, context)
        expect(property.context.id).toEqual(attrs.context.connect.id)
    })

    test('admin: read BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const [property] = await createTestBillingProperty(admin, context)
        const properties = await BillingProperty.getAll(admin, { id: property.id })

        expect(properties).toHaveLength(1)
    })

    test('user: read BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        await createTestBillingProperty(admin, context)
        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        const properties = await BillingProperty.getAll(client)

        expect(properties).toHaveLength(0)
    })

    test('anonymous: read BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        await createTestBillingProperty(admin, context)
        const client = await makeClient()

        await expectToThrowAccessDeniedErrorToObjects(async () => {
            await BillingProperty.getAll(client)
        })
    })

    test('organization integration manager: read BillingProperty', async () => {
        const { organization, integration, managerUserClient } = await makeOrganizationIntegrationManager()
        const [context] = await createTestBillingIntegrationOrganizationContext(managerUserClient, organization, integration)
        const [property] = await createTestBillingProperty(managerUserClient, context)

        const props = await BillingProperty.getAll(managerUserClient, { id: property.id })
        expect(props).toHaveLength(1)
    })

    test('admin: update BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const [property] = await createTestBillingProperty(admin, context)
        const raw = faker.lorem.words()
        const address = faker.lorem.words()
        const payload = {
            raw,
            address,
        }
        const [updated] = await updateTestBillingProperty(admin, property.id, payload)

        expect(updated.raw).toEqual(raw)
        expect(updated.address).toEqual(address)
    })

    test('user: update BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const [property] = await createTestBillingProperty(admin, context)
        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        const payload = {
            raw: faker.lorem.words(),
            address: faker.lorem.words(),
        }

        await expectToThrowAccessDeniedErrorToObj(async () => {
            await updateTestBillingProperty(client, property.id, payload)
        })
    })

    test('organization integration manager: update BillingProperty', async () => {
        const { organization, integration, managerUserClient } = await makeOrganizationIntegrationManager()
        const [context] = await createTestBillingIntegrationOrganizationContext(managerUserClient, organization, integration)
        const [property] = await createTestBillingProperty(managerUserClient, context)
        const raw = faker.lorem.words()
        const address = faker.lorem.words()
        const payload = {
            raw,
            address,
        }
        const [updated] = await updateTestBillingProperty(managerUserClient, property.id, payload)

        expect(updated.raw).toEqual(raw)
        expect(updated.address).toEqual(address)
    })

    test('anonymous: update BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const [property] = await createTestBillingProperty(admin, context)
        const client = await makeClient()
        const payload = {
            raw: faker.lorem.words(),
            globalId: faker.lorem.words(),
            address: faker.lorem.words(),
        }

        await expectToThrowAccessDeniedErrorToObj(async () => {
            await updateTestBillingProperty(client, property.id, payload)
        })
    })

    test('admin: delete BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const [property] = await createTestBillingProperty(admin, context)

        await expectToThrowAccessDeniedErrorToObj(async () => {
            await BillingProperty.delete(admin, property.id)
        })
    })

    test('user: delete BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const [property] = await createTestBillingProperty(admin, context)
        const client = await makeClientWithNewRegisteredAndLoggedInUser()

        await expectToThrowAccessDeniedErrorToObj(async () => {
            await BillingProperty.delete(client, property.id)
        })
    })

    test('anonymous: delete BillingProperty', async () => {
        const admin = await makeLoggedInAdminClient()
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const [property] = await createTestBillingProperty(admin, context)
        const client = await makeClient()

        await expectToThrowAccessDeniedErrorToObj(async () => {
            await BillingProperty.delete(client, property.id)
        })
    })

    test('organization integration manager: delete BillingProperty', async () => {
        const { organization, integration, managerUserClient } = await makeOrganizationIntegrationManager()
        const [context] = await createTestBillingIntegrationOrganizationContext(managerUserClient, organization, integration)
        const [property] = await createTestBillingProperty(managerUserClient, context)

        await expectToThrowAccessDeniedErrorToObj(async () => {
            await BillingProperty.delete(managerUserClient, property.id)
        })
    })
})