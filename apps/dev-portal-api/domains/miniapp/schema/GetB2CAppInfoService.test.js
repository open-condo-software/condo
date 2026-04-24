const { makeClient } = require('@open-condo/keystone/test.utils')
const { expectToThrowAccessDeniedErrorToResult, expectToThrowAuthenticationErrorToResult } = require('@open-condo/keystone/test.utils')

const { DEV_ENVIRONMENT } = require('@dev-portal-api/domains/miniapp/constants/publishing')
const {
    B2CApp,
    getB2CAppInfoByTestClient,
    createTestB2CApp,
    createTestB2CAppBuild,
    publishB2CAppByTestClient,
} = require('@dev-portal-api/domains/miniapp/utils/testSchema')
const {
    makeLoggedInAdminClient,
    makeLoggedInSupportClient,
    makeRegisteredAndLoggedInUser,
} = require('@dev-portal-api/domains/user/utils/testSchema')

describe('GetB2CAppInfoService', () => {
    let admin
    let support
    let b2cUser
    let b2cApp
    let b2bUser
    let anonymous
    let build
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeLoggedInSupportClient()
        b2cUser = await makeRegisteredAndLoggedInUser()
        b2bUser = await makeRegisteredAndLoggedInUser()
        anonymous = await makeClient();

        [b2cApp] = await createTestB2CApp(b2cUser);
        [build] = await createTestB2CAppBuild(b2cUser, b2cApp)
        await publishB2CAppByTestClient(b2cUser, b2cApp, { info: true, build: { id: build.id } })
        b2cApp = await B2CApp.getOne(b2cUser, { id: b2cApp.id })
    })
    describe('Access tests', () => {
        test('Admin can get app info of any app', async () => {
            const [info] = await getB2CAppInfoByTestClient(admin, b2cApp)
            expect(info).toEqual({
                id: b2cApp.developmentExportId,
                environment: DEV_ENVIRONMENT,
                currentBuild: { id: expect.stringContaining(''), version: build.version },
            })
        })
        test('Support can get app info of any app', async () => {
            const [info] = await getB2CAppInfoByTestClient(support, b2cApp)
            expect(info).toEqual({
                id: b2cApp.developmentExportId,
                environment: DEV_ENVIRONMENT,
                currentBuild: { id: expect.stringContaining(''), version: build.version },
            })
        })
        describe('User', () => {
            test('Can get app info of app he created', async () => {
                const [info] = await getB2CAppInfoByTestClient(b2cUser, b2cApp)
                expect(info).toEqual({
                    id: b2cApp.developmentExportId,
                    environment: DEV_ENVIRONMENT,
                    currentBuild: { id: expect.stringContaining(''), version: build.version },
                })
            })
            test('Cannot for other apps', async () => {
                await expectToThrowAccessDeniedErrorToResult(async () => {
                    await getB2CAppInfoByTestClient(b2bUser, b2cApp)
                })
            })
        })
        test('Anonymous cannot get any app  info', async () => {
            await expectToThrowAuthenticationErrorToResult(async () => {
                await getB2CAppInfoByTestClient(anonymous, b2cApp)
            })
        })
    })
})