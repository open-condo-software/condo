/**
 * Generated by `createschema miniapp.OIDCClient 'b2cApp:Relationship:B2CApp:CASCADE; clientId:Text; clientSecret:Text; grantTypes:Json; responseTypes:Json; developmentRedirectUri:Url; productionRedirectUri:Url'`
 */

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { makeClient } = require('@open-condo/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
    catchErrorFrom,
    expectToThrowUniqueConstraintViolationError,
} = require('@open-condo/keystone/test.utils')

const { CONDO_SUPPORTED_RESPONSE_TYPES } = require('@condo/domains/user/constants/oidc')
const { OIDC_CLIENT_UNIQUE_B2C_APP_CONSTRAINT } = require('@dev-api/domains/miniapp/constants/constraints')
const {
    OIDC_SECRET_CHAR_POOL,
    OIDC_SECRET_LENGTH,
    OIDC_GRANT_TYPES,
    OIDC_TOKEN_AUTH_BASIC_METHOD,
} = require('@dev-api/domains/miniapp/constants/oidc')
const {
    OIDCClient,
    createTestOIDCClient,
    updateTestOIDCClient,
    createTestB2CApp,
} = require('@dev-api/domains/miniapp/utils/testSchema')
const { makeLoggedInAdminClient, makeLoggedInSupportClient, makeRegisteredAndLoggedInUser } = require('@dev-api/domains/user/utils/testSchema')
// NOTE: Dynamically builds something like /^[a...zA...Z0...9]{32}$/
const OIDC_CLIENT_SECRET_PATTERN = new RegExp(`^[${OIDC_SECRET_CHAR_POOL}]{${OIDC_SECRET_LENGTH}}$`)

describe('OIDCClient', () => {
    let admin
    let support
    let user
    let anotherUser
    let anonymous
    let b2cApp
    let oidcClient
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeLoggedInSupportClient()
        user = await makeRegisteredAndLoggedInUser()
        anotherUser = await makeRegisteredAndLoggedInUser()
        anonymous = await makeClient();
        [b2cApp] = await createTestB2CApp(user)
    })
    afterEach(async () => {
        if (oidcClient) {
            await updateTestOIDCClient(admin, oidcClient.id, {
                deletedAt: dayjs().toISOString(),
            })
            oidcClient = undefined
        }
    })
    describe('CRUD', () => {
        describe('Create', () => {
            test('Admin can create OIDC client for any app', async () => {
                [oidcClient] = await createTestOIDCClient(admin, b2cApp)
                expect(oidcClient).toHaveProperty('id')
            })
            test('Support can create OIDC client for any app', async () => {
                [oidcClient] = await createTestOIDCClient(support, b2cApp)
                expect(oidcClient).toHaveProperty('id')
            })
            describe('User', () => {
                test('Can create OIDC client for app he created', async () => {
                    [oidcClient] = await createTestOIDCClient(user, b2cApp)
                    expect(oidcClient).toHaveProperty('id')
                })
                test('Cannot for other apps', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestOIDCClient(anotherUser, b2cApp)
                    })
                })
            })
            test('Anonymous cannot create any OIDC client', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestOIDCClient(anonymous, b2cApp)
                })
            })
        })
        describe('Read', () => {
            let oidcClientId
            beforeAll(async () => {
                const [client] = await createTestOIDCClient(admin, b2cApp)
                oidcClientId = client.id
            })
            afterAll(async () => {
                await updateTestOIDCClient(admin, oidcClientId, { deletedAt: dayjs().toISOString() })
            })
            test('Admin can read any oidc clients, including secrets', async () => {
                const client = await OIDCClient.getOne(admin, { id: oidcClientId })
                expect(client).toHaveProperty('id')
                expect(client).toHaveProperty('clientSecret')
                expect(client.clientSecret).not.toBeNull()
            })
            test('Support can read any oidc clients, including secrets', async () => {
                const client = await OIDCClient.getOne(support, { id: oidcClientId })
                expect(client).toHaveProperty('id')
                expect(client).toHaveProperty('clientSecret')
                expect(client.clientSecret).not.toBeNull()
            })
            describe('User', () => {
                test('Can OIDC Clients for apps he created', async () => {
                    const client = await OIDCClient.getOne(user, { id: oidcClientId })
                    expect(client).toHaveProperty('id')
                    expect(client).toHaveProperty('clientSecret')
                    expect(client.clientSecret).not.toBeNull()
                })
                test('Cannot read OIDC Clients for other apps', async () => {
                    const client = await OIDCClient.getOne(anotherUser, { id: oidcClientId })
                    expect(client).toBeUndefined()
                })
            })
            test('Anonymous cannot read any clients', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await OIDCClient.getAll(anonymous, {})
                })
            })
        })
        describe('Update / Soft-delete', () => {
            beforeEach(async () => {
                [oidcClient] = await createTestOIDCClient(admin, b2cApp)
            })
            test('Admin can update and soft-delete any OIDC Client', async () => {
                const url = faker.internet.url()
                const [updatedClient] = await updateTestOIDCClient(admin, oidcClient.id, {
                    developmentRedirectUri: url,
                })
                expect(updatedClient).toHaveProperty('developmentRedirectUri', url)
                const [deletedClient] = await updateTestOIDCClient(admin, oidcClient.id, { deletedAt: dayjs().toISOString() })
                expect(deletedClient.deletedAt).not.toBeNull()
                oidcClient = undefined
            })
            test('Support can update and soft-delete any OIDC Client', async () => {
                const url = faker.internet.url()
                const [updatedClient] = await updateTestOIDCClient(support, oidcClient.id, {
                    developmentRedirectUri: url,
                })
                expect(updatedClient).toHaveProperty('developmentRedirectUri', url)
                const [deletedClient] = await updateTestOIDCClient(support, oidcClient.id, { deletedAt: dayjs().toISOString() })
                expect(deletedClient.deletedAt).not.toBeNull()
                oidcClient = undefined
            })
            describe('User', () => {
                test('App owner can update and soft-delete OIDC Client of owned app', async () => {
                    const url = faker.internet.url()
                    const [updatedClient] = await updateTestOIDCClient(user, oidcClient.id, {
                        developmentRedirectUri: url,
                    })
                    expect(updatedClient).toHaveProperty('developmentRedirectUri', url)
                    const [deletedClient] = await updateTestOIDCClient(user, oidcClient.id, { deletedAt: dayjs().toISOString() })
                    expect(deletedClient.deletedAt).not.toBeNull()
                    oidcClient = undefined
                })
                test('Cannot update and soft-delete OIDC Clients of other apps', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestOIDCClient(anotherUser, oidcClient.id, {
                            developmentRedirectUri: faker.internet.url(),
                        })
                    })
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestOIDCClient(anotherUser, oidcClient.id, {
                            deletedAt: dayjs().toISOString(),
                        })
                    })
                })
            })
            test('Anonymous cannot update and soft-delete any OIDC Client', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestOIDCClient(anonymous, oidcClient.id, {
                        developmentRedirectUri: faker.internet.url(),
                    })
                })
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestOIDCClient(anonymous, oidcClient.id, {
                        deletedAt: dayjs().toISOString(),
                    })
                })
            })
        })
        test('Hard-delete is prohibited', async () => {
            [oidcClient] = await createTestOIDCClient(admin, b2cApp)
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await OIDCClient.delete(admin, oidcClient.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await OIDCClient.delete(support, oidcClient.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await OIDCClient.delete(user, oidcClient.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await OIDCClient.delete(anotherUser, oidcClient.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await OIDCClient.delete(anonymous, oidcClient.id)
            })
        })
    })
    describe('Field logic tests', () => {
        describe('b2cApp', () => {
            test('Cannot be updated', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp)
                const [anotherApp] = await createTestB2CApp(anotherUser)
                await catchErrorFrom(async () => {
                    await updateTestOIDCClient(admin, oidcClient.id, {
                        b2cApp: { connect: { id: anotherApp.id } },
                    })
                }, (error) => {
                    expect(error.errors[0].message).toContain('Field "b2cApp" is not defined by type "OIDCClientUpdateInput"')
                })
            })
        })
        describe('clientId', () => {
            describe('Must be resolved as app id',  () => {
                test('B2CApp', async () => {
                    [oidcClient] = await createTestOIDCClient(user, b2cApp)
                    expect(oidcClient).toHaveProperty('clientId', b2cApp.id)
                })
            })
        })
        describe('clientSecret', () => {
            test('Must be created by default', async () => {
                const [client, attrs] = await createTestOIDCClient(user, b2cApp, 'b2c')
                oidcClient = client
                expect(attrs).not.toHaveProperty('clientSecret')
                expect(oidcClient.clientSecret).toMatch(OIDC_CLIENT_SECRET_PATTERN)
            })
            test('Must be always generated on server', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp, 'b2c', {
                    clientSecret: 'weak_password',
                })
                expect(oidcClient.clientSecret).not.toEqual('weak_password')
                expect(oidcClient.clientSecret).toMatch(OIDC_CLIENT_SECRET_PATTERN)
                const [updatedClient] = await updateTestOIDCClient(user, oidcClient.id, {
                    clientSecret: 'weak_password',
                })
                expect(updatedClient.clientSecret).not.toEqual('weak_password')
                expect(updatedClient.clientSecret).not.toEqual(oidcClient.clientSecret)
                expect(updatedClient.clientSecret).toMatch(OIDC_CLIENT_SECRET_PATTERN)
            })
            test('Must not be changed if mutation data does not contain clientSecret field', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp, 'b2c')
                const [updatedClient] = await updateTestOIDCClient(user, oidcClient.id, {
                    developmentRedirectUri: faker.internet.url(),
                })
                expect(updatedClient).toHaveProperty('clientSecret', oidcClient.clientSecret)
            })
        })
        describe('grantTypes', () => {
            test('Must fill and contain all grant types by default', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp)
                expect(oidcClient).toHaveProperty('grantTypes', OIDC_GRANT_TYPES)
            })
            test('Can be changed manually', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp, 'b2c',  {
                    grantTypes: ['implicit'],
                })
                expect(oidcClient).toHaveProperty('grantTypes', ['implicit'])
                const [updatedClient] = await updateTestOIDCClient(user, oidcClient.id, {
                    grantTypes: ['implicit', 'refresh_token'],
                })
                expect(updatedClient).toHaveProperty('grantTypes', ['implicit', 'refresh_token'])
            })
            test('Can accept single string', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp, 'b2c', {
                    grantTypes: 'implicit',
                })
                expect(oidcClient).toHaveProperty('grantTypes', ['implicit'])
            })
            describe('Must accept only valid grant types', () => {
                const invalidCases = [
                    ['explicit', 'Value "explicit" does not exist in "OIDCGrantType" enum'],
                    [{ obj: 1 }, 'Enum "OIDCGrantType" cannot represent non-string value'],
                    [[], 'JSON was not in the correct format. must NOT have fewer than 1 items'],
                    [['implicit', 'explicit'], 'Value "explicit" does not exist in "OIDCGrantType" enum'],
                    [['implicit', 'implicit', 'implicit'], 'JSON was not in the correct format. must NOT have duplicate items'],
                    [['authorization_token'], 'Value "authorization_token" does not exist in "OIDCGrantType" enum'],
                ]
                test.each(invalidCases)('%p', async (grantTypes, message) => {
                    await catchErrorFrom(async () => {
                        await createTestOIDCClient(user, b2cApp, 'b2c', {
                            grantTypes,
                        })
                    }, (error) => {
                        expect(error).toBeDefined()
                        expect(error.errors).toHaveLength(1)
                        expect(error.errors[0]).toHaveProperty('message')
                        expect(error.errors[0].message).toContain(message)
                    })
                })
            })
        })
        describe('responseTypes', () => {
            test('Must fill and contain all response types by default', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp)
                expect(oidcClient).toHaveProperty('responseTypes', CONDO_SUPPORTED_RESPONSE_TYPES)
            })
            test('Can be changed manually', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp, 'b2c',  {
                    responseTypes: 'code',
                })
                expect(oidcClient).toHaveProperty('responseTypes', ['code'])
                const [updatedClient] = await updateTestOIDCClient(user, oidcClient.id, {
                    responseTypes: ['code', 'id_token'],
                })
                expect(updatedClient).toHaveProperty('responseTypes', ['code', 'id_token'])
            })
            test('Can accept single string', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp, 'b2c', {
                    responseTypes: 'code id_token',
                })
                expect(oidcClient).toHaveProperty('responseTypes', ['code id_token'])
            })
            describe('Must accept only valid response types', () => {
                const invalidCases = [
                    ['secret code', 'JSON was not in the correct format. must be equal to one of the allowed values'],
                    [{ obj: 1 }, 'String cannot represent a non string value: { obj: 1 }'],
                    [[], 'JSON was not in the correct format. must NOT have fewer than 1 items'],
                    [['id_token code'], 'JSON was not in the correct format. must be equal to one of the allowed values'],
                    [['id_token', 'code', 'id_token'], 'JSON was not in the correct format. must NOT have duplicate items'],
                    [['secret_code'], 'JSON was not in the correct format. must be equal to one of the allowed values'],
                ]
                test.each(invalidCases)('%p', async (responseTypes, message) => {
                    await catchErrorFrom(async () => {
                        await createTestOIDCClient(user, b2cApp, 'b2c', {
                            responseTypes,
                        })
                    }, (error) => {
                        expect(error).toBeDefined()
                        expect(error.errors).toHaveLength(1)
                        expect(error.errors[0]).toHaveProperty('message')
                        expect(error.errors[0].message).toContain(message)
                    })
                })
            })
        })
        describe('tokenAuthMethod', () => {
            test('Must fill and contain all response types by default', async () => {
                [oidcClient] = await createTestOIDCClient(user, b2cApp)
                expect(oidcClient).toHaveProperty('tokenAuthMethod', OIDC_TOKEN_AUTH_BASIC_METHOD)
            })
        })
    })
    describe('Constraints', () => {
        test('Each b2c app can have only 1 OIDC Client', async () => {
            [oidcClient] = await createTestOIDCClient(user, b2cApp)
            expect(oidcClient).toHaveProperty('id')
            await expectToThrowUniqueConstraintViolationError(async () => {
                await createTestOIDCClient(user, b2cApp)
            }, OIDC_CLIENT_UNIQUE_B2C_APP_CONSTRAINT)
            const [deletedClient] = await updateTestOIDCClient(user,  oidcClient.id, {
                deletedAt: dayjs().toISOString(),
            })
            expect(deletedClient.deletedAt).not.toBeNull();
            [oidcClient] = await createTestOIDCClient(user, b2cApp)
            expect(oidcClient).toHaveProperty('id')
        })
    })
})