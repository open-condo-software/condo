const { waitFor } = require('@open-condo/keystone/test.utils')

const { PUBLISH_REQUEST_APPROVED_STATUS } = require('@dev-portal-api/domains/miniapp/constants/publishing')
const {
    createTestB2BApp,
    B2BApp,
    createTestB2BAppPublishRequest,
} = require('@dev-portal-api/domains/miniapp/utils/testSchema')
const { makeRegisteredAndLoggedInUser, makeLoggedInSupportClient } = require('@dev-portal-api/domains/user/utils/testSchema')


async function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

describe('publishB2BApp task spec', () => {
    let user
    let support
    beforeAll(async () => {
        user = await makeRegisteredAndLoggedInUser()
        support = await makeLoggedInSupportClient()
    })
    describe('Triggers', () => {
        describe('B2BApp', () => {
            test('Must trigger dev publishing on app creation', async () => {
                const [app] = await createTestB2BApp(user)
                expect(app).toHaveProperty('id')
                expect(app).toHaveProperty('developmentExportId', null)

                await waitFor(async () => {
                    const updatedApp = await B2BApp.getOne(user, { id: app.id })
                    expect(updatedApp).toHaveProperty('developmentExportId')
                    expect(updatedApp.developmentExportId).not.toBeNull()
                })
            })
            test('Must trigger publishing to specific env on specific field update', async () => {
                const [app] = await createTestB2BApp(user)
                expect(app).toHaveProperty('id')
                expect(app).toHaveProperty('developmentExportId', null)

                const [publishRequest] = await createTestB2BAppPublishRequest(user, app, {
                    status: PUBLISH_REQUEST_APPROVED_STATUS,
                    isAppTested: true,
                    isContractSigned: true,
                    isInfoApproved: true,
                })
                // expect()

                // let devPublishedAt
                // let prodPublishedAt

                await waitFor(async () => {
                    const updatedApp = await B2BApp.getOne(user, { id: app.id })
                    expect(updatedApp).toHaveProperty('developmentExportId')
                    expect(updatedApp.developmentExportId).not.toBeNull()
                })

                // await []
            })
        })
    })

    // describe('Must trigger prod publishing on B2BAppPublishRequest approve', async () => {
    //     const [app] = await createTestB2BApp(user)
    //     expect(app).toHaveProperty('id')
    //     expect(app).toHaveProperty('developmentExportId', null)
    //
    //     const [publishRequest] = await createTestB2BAppPublishRequest(user, app)
    //     expect(publishRequest).toHaveProperty('id')
    //
    //     await sleep(10_0000)
    //     const updatedApp = await B2BApp.getOne(user, { id: app.id })
    //     expect(updatedApp).toHaveProperty('productionExportId', null)
    //
    //     const []
    // })
})