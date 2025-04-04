/**
 * Generated by `createservice miniapp.PublishB2CAppService`
 */

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateGQLTestUtils } = require('@open-condo/codegen/generate.test.utils')
const { GQLErrorCode: { BAD_USER_INPUT, INTERNAL_ERROR } } = require('@open-condo/keystone/errors')
const {
    makeClient,
    expectToThrowAccessDeniedErrorToResult,
    expectToThrowAuthenticationErrorToResult,
    expectToThrowGQLError,
} = require('@open-condo/keystone/test.utils')

const { REMOTE_SYSTEM } = require('@dev-portal-api/domains/common/constants/common')
const {
    APP_NOT_FOUND,
    FIRST_PUBLISH_WITHOUT_INFO,
    CONDO_APP_NOT_FOUND,
    BUILD_NOT_FOUND,
    PUBLISH_NOT_ALLOWED,
} = require('@dev-portal-api/domains/miniapp/constants/errors')
const { PROD_ENVIRONMENT, PUBLISH_REQUEST_APPROVED_STATUS, DEV_ENVIRONMENT } = require('@dev-portal-api/domains/miniapp/constants/publishing')
const {
    publishB2CAppByTestClient,
    createTestB2CApp,
    updateTestB2CApp,
    B2CApp,
    createTestB2CAppBuild,
    updateTestB2CAppBuild,
    B2CAppBuild,
    createTestB2CAppPublishRequest,
    updateTestB2CAppPublishRequest,
    B2CAppAccessRight,
    createOIDCClientByTestClient,
    registerAppUserServiceByTestClient,
    createCondoB2CApp,
    createCondoB2CAppAccessRight,
    importB2CAppByTestClient,
} = require('@dev-portal-api/domains/miniapp/utils/testSchema')
const {
    makeLoggedInAdminClient,
    makeLoggedInSupportClient,
    makeRegisteredAndLoggedInUser,
    makeLoggedInCondoAdminClient,
    verifyEmailByTestClient,
} = require('@dev-portal-api/domains/user/utils/testSchema')

const CondoB2CApp = generateGQLTestUtils(generateGqlQueries('B2CApp', '{ id name developer logo { publicUrl } currentBuild { id } importId importRemoteSystem deletedAt v }'))
const CondoB2CAppBuild = generateGQLTestUtils(generateGqlQueries('B2CAppBuild', '{ id version app { id } importId importRemoteSystem deletedAt }'))
const CondoOIDCClient = generateGQLTestUtils(generateGqlQueries('OidcClient', '{ id deletedAt isEnabled clientId payload }'))
const CondoB2CAppAccessRight = generateGQLTestUtils(generateGqlQueries('B2CAppAccessRight', '{ id user { id } app { id } importId importRemoteSystem v deletedAt }'))

describe('PublishB2CAppService', () => {
    let admin
    let support
    let user
    let anonymous
    let condoAdmin
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        condoAdmin = await makeLoggedInCondoAdminClient()
        support = await makeLoggedInSupportClient()
        user = await makeRegisteredAndLoggedInUser()
        anonymous = await makeClient()
    })
    describe('Access tests', () => {
        let userApp
        let anotherApp
        beforeAll(async () => {
            [userApp] = await createTestB2CApp(user);
            [anotherApp] = await createTestB2CApp(admin)
        })
        test('Admin can publish any app', async () => {
            const [result] = await publishB2CAppByTestClient(admin, userApp)
            expect(result).toHaveProperty('success', true)
        })
        test('Support can publish any app', async () => {
            const [result] = await publishB2CAppByTestClient(support, userApp)
            expect(result).toHaveProperty('success', true)
        })
        describe('User', () => {
            test('Can publish app if user if app creator', async () => {
                const [result] = await publishB2CAppByTestClient(user, userApp)
                expect(result).toHaveProperty('success', true)
            })
            test('Cannot otherwise', async () => {
                await expectToThrowAccessDeniedErrorToResult(async () => {
                    await publishB2CAppByTestClient(user, anotherApp)
                })
            })
        })
        test('Anonymous cannot', async () => {
            await expectToThrowAuthenticationErrorToResult(async () => {
                await publishB2CAppByTestClient(anonymous, userApp)
            })
        })
    })
    describe('Logic tests', () => {
        describe('B2CAppPublishRequest', () => {
            test('Mutation must throw GQLError if an attempt is made to publish to a production stand without a approved B2CAppPublishRequest for app', async () => {
                const [app] = await createTestB2CApp(user)
                await expectToThrowGQLError(async () => {
                    await publishB2CAppByTestClient(user, app, { info: true }, PROD_ENVIRONMENT)
                }, {
                    code: BAD_USER_INPUT,
                    type: PUBLISH_NOT_ALLOWED,
                }, 'result')
                const [request] = await createTestB2CAppPublishRequest(user, app)
                expect(request).toHaveProperty('id')

                await expectToThrowGQLError(async () => {
                    await publishB2CAppByTestClient(user, app, { info: true }, PROD_ENVIRONMENT)
                }, {
                    code: BAD_USER_INPUT,
                    type: PUBLISH_NOT_ALLOWED,
                }, 'result')

                const [updatedRequest] = await updateTestB2CAppPublishRequest(support, request.id, {
                    isAppTested: true,
                    isContractSigned: true,
                    isInfoApproved: true,
                    status: PUBLISH_REQUEST_APPROVED_STATUS,
                })
                expect(updatedRequest).toHaveProperty('status', PUBLISH_REQUEST_APPROVED_STATUS)

                const [result] = await publishB2CAppByTestClient(user, app, { info: true }, PROD_ENVIRONMENT)
                expect(result).toHaveProperty('success', true)

                const [deletedRequest] = await updateTestB2CAppPublishRequest(support, request.id, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedRequest).toHaveProperty('deletedAt')
                expect(deletedRequest.deletedAt).not.toBeNull()

                await expectToThrowGQLError(async () => {
                    await publishB2CAppByTestClient(user, app, { info: true }, PROD_ENVIRONMENT)
                }, {
                    code: BAD_USER_INPUT,
                    type: PUBLISH_NOT_ALLOWED,
                }, 'result')
            })
        })
        describe('B2CApp', () => {
            let app
            beforeEach(async () => {
                [app] = await createTestB2CApp(user)
            })
            test('Mutation must throw GQLError if app is not found', async () => {
                await expectToThrowGQLError(async () => {
                    await publishB2CAppByTestClient(admin, { id: faker.datatype.uuid() })
                }, {
                    code: BAD_USER_INPUT,
                    type: APP_NOT_FOUND,
                }, 'result')
            })
            test('Info must be included if app was not published before', async () => {
                await expectToThrowGQLError(async () => {
                    await publishB2CAppByTestClient(user, app, {})
                }, {
                    code: BAD_USER_INPUT,
                    type: FIRST_PUBLISH_WITHOUT_INFO,
                }, 'result')
            })
            test('Condo app must be created / updated if info passed as an option', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(firstResult).toHaveProperty('success', true)

                const apiApp = await B2CApp.getOne(admin, { id: app.id })
                expect(apiApp).toHaveProperty('developmentExportId')
                expect(apiApp.developmentExportId).not.toBeNull()

                const createdCondoApp = await CondoB2CApp.getOne(condoAdmin, { id: apiApp.developmentExportId })
                expect(createdCondoApp).toHaveProperty('id', apiApp.developmentExportId)
                expect(createdCondoApp).toHaveProperty('importId', apiApp.id)
                expect(createdCondoApp).toHaveProperty('importRemoteSystem', REMOTE_SYSTEM)
                expect(createdCondoApp).toHaveProperty('deletedAt', null)
                expect(createdCondoApp).toHaveProperty('v', 1)

                const [secondResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(secondResult).toHaveProperty('success', true)

                const updatedCondoApp = await CondoB2CApp.getOne(condoAdmin, { id: apiApp.developmentExportId })
                expect(updatedCondoApp).toHaveProperty('id', apiApp.developmentExportId)
                expect(updatedCondoApp).toHaveProperty('importId', apiApp.id)
                expect(updatedCondoApp).toHaveProperty('importRemoteSystem', REMOTE_SYSTEM)
                expect(updatedCondoApp).toHaveProperty('deletedAt', null)
                expect(updatedCondoApp).toHaveProperty('v', 2)
            })
            test('Condo app must be recreated in case of deletion', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(firstResult).toHaveProperty('success', true)

                const firstApiApp = await B2CApp.getOne(admin, { id: app.id })
                const firstCondoAppId = firstApiApp.developmentExportId

                const deletedCondoApp = await CondoB2CApp.update(condoAdmin, firstCondoAppId, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedCondoApp.deletedAt).not.toBeNull()

                const [secondResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(secondResult).toHaveProperty('success', true)

                const secondApiApp = await B2CApp.getOne(admin, { id: app.id })
                expect(secondApiApp.developmentExportId).not.toBeNull()
                expect(secondApiApp.developmentExportId).not.toBe(firstCondoAppId)
            })
            test('Publish job must transfer all B2CApp fields properly', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(firstResult).toHaveProperty('success', true)

                const apiApp = await B2CApp.getOne(admin, { id: app.id })
                expect(apiApp).toHaveProperty('developmentExportId')
                expect(apiApp.developmentExportId).not.toBeNull()

                const createdCondoApp = await CondoB2CApp.getOne(condoAdmin, { id: apiApp.developmentExportId })
                expect(createdCondoApp).toHaveProperty('name', app.name)
                expect(createdCondoApp).toHaveProperty('developer', user.user.name)
                expect(createdCondoApp).toHaveProperty(['logo', 'publicUrl'])
                const initialLogo = createdCondoApp.logo.publicUrl

                const name = faker.commerce.product()
                const developer = faker.company.name()
                await updateTestB2CApp(user, app.id, { name, developer })

                const [secondResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(secondResult).toHaveProperty('success', true)

                const updatedCondoApp = await CondoB2CApp.getOne(condoAdmin, { id: apiApp.developmentExportId })
                expect(updatedCondoApp).toHaveProperty('name', name)
                expect(updatedCondoApp).toHaveProperty('developer', developer)
                expect(updatedCondoApp).toHaveProperty(['logo', 'publicUrl'])
                expect(updatedCondoApp.logo.publicUrl).not.toBe(initialLogo)
            })
            test('Publishing app with no developer or logo must use author name and default logo', async () => {
                const apiApp = await B2CApp.getOne(admin, { id: app.id })
                expect(apiApp).toHaveProperty('developer', null)
                expect(apiApp).toHaveProperty('logo', null)

                const [firstResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(firstResult).toHaveProperty('success', true)

                const createdCondoApp = await CondoB2CApp.getOne(condoAdmin, { importId: apiApp.id, importRemoteSystem: REMOTE_SYSTEM })
                expect(createdCondoApp).toHaveProperty('developer', user.user.name)
                expect(createdCondoApp).toHaveProperty(['logo', 'publicUrl'])
            })
            test('exportId must be restored from null if condo app was found by importId', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(firstResult).toHaveProperty('success', true)

                const apiApp = await B2CApp.getOne(admin, { id: app.id })
                const condoAppId = apiApp.developmentExportId

                const [updatedApiApp] = await updateTestB2CApp(admin, app.id, { developmentExportId: null })
                expect(updatedApiApp).toHaveProperty('developmentExportId', null)

                const [secondResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(secondResult).toHaveProperty('success', true)

                const finalApiApp = await B2CApp.getOne(user, { id: app.id })
                expect(finalApiApp).toHaveProperty('developmentExportId', condoAppId)

                const condoApps = await CondoB2CApp.getAll(condoAdmin, { importId: app.id, importRemoteSystem: REMOTE_SYSTEM })
                expect(condoApps).toHaveLength(1)
            })
            test('Must update exportId if condo app was found by importId', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(firstResult).toHaveProperty('success', true)

                const apiApp = await B2CApp.getOne(admin, { id: app.id })
                const condoAppId = apiApp.developmentExportId
                const [updatedApiApp] = await updateTestB2CApp(admin, app.id, { developmentExportId: faker.datatype.uuid() })

                expect(updatedApiApp.developmentExportId).not.toEqual(condoAppId)

                const [secondResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(secondResult).toHaveProperty('success', true)

                const finalApiApp = await B2CApp.getOne(admin, { id: app.id })
                expect(finalApiApp).toHaveProperty('developmentExportId', condoAppId)
            })
            test('Must throw an error if condo app was deleted and info is not passed', async () => {
                const [build] = await createTestB2CAppBuild(user, app)
                const [firstResult] = await publishB2CAppByTestClient(user, app, { info: true })
                expect(firstResult).toHaveProperty('success', true)

                const apiApp = await B2CApp.getOne(admin, { id: app.id })
                expect(apiApp.developmentExportId).not.toBeNull()
                const condoAppId = apiApp.developmentExportId

                const deletedCondoApp = await CondoB2CApp.update(condoAdmin, condoAppId, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedCondoApp.deletedAt).not.toBeNull()

                await expectToThrowGQLError(async () => {
                    await publishB2CAppByTestClient(user, app, { info: false, build: { id: build.id } })
                }, {
                    code: INTERNAL_ERROR,
                    type: CONDO_APP_NOT_FOUND,
                }, 'result')
            })
        })
        describe('B2CAppBuild', () => {
            let app
            let build
            beforeEach(async () => {
                [app] = await createTestB2CApp(user);
                [build] = await createTestB2CAppBuild(user, app)
                await publishB2CAppByTestClient(user, app, { info: true })
            })
            test('Mutation must throw GQLError if build is not found', async () => {
                await expectToThrowGQLError(async () => {
                    await publishB2CAppByTestClient(user, app, { build: { id: faker.datatype.uuid() } })
                }, {
                    code: BAD_USER_INPUT,
                    type: BUILD_NOT_FOUND,
                }, 'result')
            })
            test('Condo build must be created if not exists in condo and passed as an option', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(firstResult).toHaveProperty('success', true)

                const apiBuild = await B2CAppBuild.getOne(admin, { id: build.id })
                expect(apiBuild).toHaveProperty('developmentExportId')
                expect(apiBuild.developmentExportId).not.toBeNull()

                const condoBuild = await CondoB2CAppBuild.getOne(condoAdmin, { id: apiBuild.developmentExportId })
                expect(condoBuild).toHaveProperty('importRemoteSystem', REMOTE_SYSTEM)
                expect(condoBuild).toHaveProperty('importId', apiBuild.id)

                const [secondResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(secondResult).toHaveProperty('success', true)

                const allCondoBuilds = await CondoB2CAppBuild.getAll(condoAdmin, { app: { id: condoBuild.app.id } })
                expect(allCondoBuilds).toHaveLength(1)
                expect(allCondoBuilds[0]).toHaveProperty('id', condoBuild.id)
            })
            test('Condo build must be recreated in case of deletion', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(firstResult).toHaveProperty('success', true)

                const apiBuild = await B2CAppBuild.getOne(admin, { id: build.id })
                expect(apiBuild).toHaveProperty('developmentExportId')
                expect(apiBuild.developmentExportId).not.toBeNull()

                const deletedCondoBuild = await CondoB2CAppBuild.update(condoAdmin, apiBuild.developmentExportId, {
                    deletedAt: dayjs().toISOString(),
                    dv: 1,
                    sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
                })
                expect(deletedCondoBuild).toHaveProperty('deletedAt')
                expect(deletedCondoBuild.deletedAt).not.toBeNull()

                const [secondResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(secondResult).toHaveProperty('success', true)

                const allCondoBuilds = await CondoB2CAppBuild.getAll(condoAdmin, { app: { id: deletedCondoBuild.app.id } })
                expect(allCondoBuilds).toHaveLength(1)
                expect(allCondoBuilds[0]).toHaveProperty('id')
                expect(allCondoBuilds[0].id).not.toBe(deletedCondoBuild.id)
            })
            test('exportId must be restored from null if build was found by importId', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(firstResult).toHaveProperty('success', true)

                const [apiBuild] = await updateTestB2CAppBuild(admin, build.id, {
                    developmentExportId: null,
                })
                expect(apiBuild).toHaveProperty('developmentExportId', null)
                const condoBuild = await CondoB2CAppBuild.getOne(condoAdmin, { app: { importId: app.id, importRemoteSystem: REMOTE_SYSTEM } })

                const [secondResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(secondResult).toHaveProperty('success', true)

                const updatedBuild = await B2CAppBuild.getOne(admin, { id: build.id })
                expect(updatedBuild).toHaveProperty('developmentExportId', condoBuild.id)

                const allCondoBuilds = await CondoB2CAppBuild.getAll(condoAdmin, { app: { id: condoBuild.app.id } })
                expect(allCondoBuilds).toHaveLength(1)
                expect(allCondoBuilds[0]).toHaveProperty('id', condoBuild.id)
            })
            test('Must update exportId if condo build was found by importId', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(firstResult).toHaveProperty('success', true)

                const fakeExportId = faker.datatype.uuid()
                const [apiBuild] = await updateTestB2CAppBuild(admin, build.id, {
                    developmentExportId: fakeExportId,
                })
                expect(apiBuild).toHaveProperty('developmentExportId', fakeExportId)
                const condoBuild = await CondoB2CAppBuild.getOne(condoAdmin, { app: { importId: app.id, importRemoteSystem: REMOTE_SYSTEM } })

                const [secondResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(secondResult).toHaveProperty('success', true)

                const updatedBuild = await B2CAppBuild.getOne(admin, { id: build.id })
                expect(updatedBuild).toHaveProperty('developmentExportId', condoBuild.id)

                const allCondoBuilds = await CondoB2CAppBuild.getAll(condoAdmin, { app: { id: condoBuild.app.id } })
                expect(allCondoBuilds).toHaveLength(1)
                expect(allCondoBuilds[0]).toHaveProperty('id', condoBuild.id)
            })
            test('Publish job must transfer all B2CAppBuild fields properly', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(firstResult).toHaveProperty('success', true)

                const apiApp = await B2CApp.getOne(admin, { id: app.id })
                const apiBuild = await B2CAppBuild.getOne(admin, { id: build.id })
                const condoBuild = await CondoB2CAppBuild.getOne(condoAdmin, { id: apiBuild.developmentExportId })
                expect(condoBuild).toHaveProperty('version', apiBuild.version)
                expect(condoBuild).toHaveProperty(['app', 'id'], apiApp.developmentExportId)
            })
            test('Condo app\'s current build must be switched to published', async () => {
                const [firstResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(firstResult).toHaveProperty('success', true)

                const firstCondoBuild = await CondoB2CAppBuild.getOne(condoAdmin, { importId: build.id, importRemoteSystem: REMOTE_SYSTEM })
                expect(firstCondoBuild).toHaveProperty('id')

                const condoApp = await CondoB2CApp.getOne(condoAdmin, { importId: app.id, importRemoteSystem: REMOTE_SYSTEM })
                expect(condoApp).toHaveProperty(['currentBuild', 'id'], firstCondoBuild.id)

                const [secondBuild] = await createTestB2CAppBuild(user, app)
                const [secondResult] = await publishB2CAppByTestClient(user, app, { build: { id: secondBuild.id } })
                expect(secondResult).toHaveProperty('success', true)

                const secondCondoBuild = await CondoB2CAppBuild.getOne(condoAdmin, { importId: secondBuild.id, importRemoteSystem: REMOTE_SYSTEM })
                expect(secondCondoBuild).toHaveProperty('id')

                const updatedCondoApp = await CondoB2CApp.getOne(condoAdmin, { importId: app.id, importRemoteSystem: REMOTE_SYSTEM })
                expect(updatedCondoApp).toHaveProperty(['currentBuild', 'id'], secondCondoBuild.id)

                const [thirdResult] = await publishB2CAppByTestClient(user, app, { build: { id: build.id } })
                expect(thirdResult).toHaveProperty('success', true)

                const finalCondoApp = await CondoB2CApp.getOne(condoAdmin, { importId: app.id, importRemoteSystem: REMOTE_SYSTEM })
                expect(finalCondoApp).toHaveProperty(['currentBuild', 'id'], firstCondoBuild.id)

                const allCondoBuilds = await CondoB2CAppBuild.getAll(condoAdmin, { app: { importId: app.id, importRemoteSystem: REMOTE_SYSTEM } })
                expect(allCondoBuilds).toHaveLength(2)
                expect(allCondoBuilds).toEqual(expect.arrayContaining([
                    expect.objectContaining({ id: firstCondoBuild.id }),
                    expect.objectContaining({ id: secondCondoBuild.id }),
                ]))
            })
        })
        describe('OIDCClient', () => {
            let app
            let oidcClient
            beforeEach(async () => {
                [app] = await createTestB2CApp(user);
                [oidcClient] = await createOIDCClientByTestClient(user, app)
            })
            test('Created OIDC client must become enabled after publishing', async () => {
                const condoClientBefore = await CondoOIDCClient.getOne(condoAdmin, { id: oidcClient.id })
                expect(condoClientBefore).toHaveProperty('isEnabled', false)
                expect(condoClientBefore).toHaveProperty('deletedAt', null)
                expect(condoClientBefore).toHaveProperty('payload')
                expect(condoClientBefore).toHaveProperty('clientId')

                const [result] = await publishB2CAppByTestClient(user, app)
                expect(result).toHaveProperty('success', true)

                const condoClientAfter = await CondoOIDCClient.getOne(condoAdmin, { id: oidcClient.id })
                expect(condoClientAfter).toHaveProperty('isEnabled', true)
                expect(condoClientAfter).toHaveProperty('deletedAt', null)
                expect(condoClientAfter).toHaveProperty('clientId', condoClientBefore.clientId)
                expect(condoClientAfter).toHaveProperty('payload', condoClientBefore.payload)
            })
        })
        describe('B2CAppAccessRight', () => {
            test('Publishing application for the first time after registeringAppUser must create B2CAppAccessRight in condo', async () => {
                const [app] = await createTestB2CApp(user)
                const confirmAction = await verifyEmailByTestClient(user, admin)
                const [registerResult] = await registerAppUserServiceByTestClient(user, app, confirmAction)
                expect(registerResult).toHaveProperty('id')
                const [publishResult] = await publishB2CAppByTestClient(user, app)
                expect(publishResult).toHaveProperty('success', true)

                const exportField = `${DEV_ENVIRONMENT}ExportId`

                const apiApp = await B2CApp.getOne(admin, { id: app.id })
                expect(apiApp).toHaveProperty(exportField)
                expect(apiApp[exportField]).not.toBeNull()
                const apiRight = await B2CAppAccessRight.getOne(user, { app: { id: app.id }, environment: DEV_ENVIRONMENT })
                expect(apiRight).toHaveProperty(exportField)
                expect(apiRight[exportField]).not.toBeNull()

                const condoAccessRight = await CondoB2CAppAccessRight.getOne(condoAdmin, { app: { id: apiApp[exportField] } })
                expect(condoAccessRight).toHaveProperty('id', apiRight[exportField])
                expect(condoAccessRight).toHaveProperty('importId', apiRight.id)
                expect(condoAccessRight).toHaveProperty('importRemoteSystem', REMOTE_SYSTEM)
                expect(condoAccessRight).toHaveProperty(['user', 'id'], registerResult.id)
            })
            test('Republishing app must not update accessRight', async () => {
                const [app] = await createTestB2CApp(user)
                const confirmAction = await verifyEmailByTestClient(user, admin)
                const [registerResult] = await registerAppUserServiceByTestClient(user, app, confirmAction)
                expect(registerResult).toHaveProperty('id')
                const [publishResult] = await publishB2CAppByTestClient(user, app)
                expect(publishResult).toHaveProperty('success', true)

                const exportField = `${DEV_ENVIRONMENT}ExportId`

                const apiRight = await B2CAppAccessRight.getOne(user, { app: { id: app.id }, environment: DEV_ENVIRONMENT })

                const condoAccessRight = await CondoB2CAppAccessRight.getOne(condoAdmin, { id: apiRight[exportField] })
                expect(condoAccessRight).toHaveProperty('v', 1)

                const [secondPublishResult] = await publishB2CAppByTestClient(user, app)
                expect(secondPublishResult).toHaveProperty('success', true)

                const finalCondoRight = await CondoB2CAppAccessRight.getOne(condoAdmin, { id: apiRight[exportField] })
                expect(finalCondoRight).toHaveProperty('v', 1)
            })
            test('Publishing app must delete existing access right if it\'s linked to another user', async () => {
                const [condoApp] = await createCondoB2CApp(condoAdmin)
                const [condoRight] = await createCondoB2CAppAccessRight(condoAdmin, condoApp)
                expect(condoRight).toHaveProperty('id')
                const [app] = await createTestB2CApp(user)

                // NOTE: app was imported before .accessRight option exists
                await importB2CAppByTestClient(support, app, condoApp, null, { options: { info: true, builds: true, publish: true, accessRight: false } })

                const confirmAction = await verifyEmailByTestClient(user, admin)
                const [registerResult] = await registerAppUserServiceByTestClient(user, app, confirmAction)
                expect(registerResult).toHaveProperty('id')
                const [publishResult] = await publishB2CAppByTestClient(user, app)
                expect(publishResult).toHaveProperty('success', true)

                const oldRight = await CondoB2CAppAccessRight.getOne(condoAdmin, { id: condoRight.id })
                expect(oldRight).toBeUndefined()

                const exportField = `${DEV_ENVIRONMENT}ExportId`
                const apiApp = await B2CApp.getOne(admin, { id: app.id })
                const newRight = await CondoB2CAppAccessRight.getOne(condoAdmin, { app: { id: apiApp[exportField] } })
                expect(newRight).toHaveProperty('id')
                expect(newRight).toHaveProperty(['user', 'id'], registerResult.id)
            })
        })
        test('Publish all at once must work as expected', async () => {
            const [app] = await createTestB2CApp(user)
            const [build] = await createTestB2CAppBuild(user, app)

            const [result] = await publishB2CAppByTestClient(user, app, { info: true, build: { id: build.id } })
            expect(result).toHaveProperty('success', true)

            const condoApp = await CondoB2CApp.getOne(condoAdmin, { importId: app.id, importRemoteSystem: REMOTE_SYSTEM })
            expect(condoApp).toHaveProperty('id')
            const condoBuild = await CondoB2CAppBuild.getOne(condoAdmin, { importId: build.id, importRemoteSystem: REMOTE_SYSTEM })
            expect(condoBuild).toHaveProperty('id')
            expect(condoBuild).toHaveProperty(['app', 'id'], condoApp.id)
            expect(condoApp).toHaveProperty(['currentBuild', 'id'], condoBuild.id)
        })
    })
})