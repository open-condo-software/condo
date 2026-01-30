const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')

const {
    PUSH_FAKE_TOKEN_SUCCESS,
    PUSH_FAKE_TOKEN_FAIL,
    APPLE_CONFIG_TEST_PUSHTOKEN_ENV,
    APPLE_CONFIG_TEST_VOIP_PUSHTOKEN_ENV,
    PUSH_TYPE_SILENT_DATA,
    PUSH_TYPE_DEFAULT,
    FAKE_SUCCESS_MESSAGE_PREFIX,
    FAKE_ERROR_MESSAGE_PREFIX,
    APP_RESIDENT_ID_IOS,
} = require('@condo/domains/notification/constants/constants')

const { APS_RESPONSE_STATUS_SUCCESS } = require('./apple/constants')
const {
    AppleAdapter,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
} = require('./appleAdapter')

const adapter = new AppleAdapter()
const FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP = new RegExp(`^${FAKE_SUCCESS_MESSAGE_PREFIX}`)
const FAKE_ERROR_MESSAGE_PREFIX_REGEXP = new RegExp(`^${FAKE_ERROR_MESSAGE_PREFIX}`)
const APPLE_TEST_PUSHTOKEN = conf[APPLE_CONFIG_TEST_PUSHTOKEN_ENV] || null
const APPLE_TEST_VOIP_PUSHTOKEN = conf[APPLE_CONFIG_TEST_VOIP_PUSHTOKEN_ENV] || null


jest.mock('@open-condo/config',  () => {
    const actual = jest.requireActual('@open-condo/config')
    return {
        ...actual,
        APPS_WITH_DISABLED_NOTIFICATIONS: '["condo.app.clients"]',
    }
})
describe('Apple adapter utils', () => {

    it('should succeed sending push notification to fake success push token', async () => {
        const tokens = [PUSH_FAKE_TOKEN_SUCCESS]
        const [isOk, result] = await adapter.sendNotification({
            tokens,
            notification: {
                title: 'Doma.ai',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                app : 'condo',
                type: 'notification',
            },
        })

        expect(isOk).toBeTruthy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(1)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(1)
        expect(result.responses[0].success).toBeTruthy()
        expect(result.responses[0].headers['apns-id']).toMatch(FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP)
        expect(result.responses[0].headers[':status']).toEqual(APS_RESPONSE_STATUS_SUCCESS)
    })

    it('doesnt send push notification to app with disabled notifications', async () => {
        const tokens = [PUSH_FAKE_TOKEN_SUCCESS]
        const [isOk, result] = await adapter.sendNotification({
            tokens,
            notification: {
                title: 'Condo',
                body: `${dayjs().format()} Condo greets you!`,
            },
            // NOTE(YEgorLu): data.app only in tests looks like
            // data: {
            //     app : 'condo.app.clients',
            //     type: 'notification',
            // },
            appIds: {
                [PUSH_FAKE_TOKEN_SUCCESS]: 'condo.app.clients',
            },
        })

        expect(isOk).toBeFalsy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(0)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(0)
    })

    it.skip('tries to send push notification to real test push token if provided ', async () => {
        const token = APPLE_TEST_PUSHTOKEN

        if (!token) return

        const tokens = [token]
        const payload = {
            tokens,
            notification: {
                title: 'Doma.ai',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                app: 'condo',
                type: 'notification',
            },
            appIds: { [token]: APP_RESIDENT_ID_IOS },
            pushTypes: { [token]: PUSH_TYPE_DEFAULT },
        }
        const [isOk, result] = await adapter.sendNotification(payload, token === APPLE_TEST_VOIP_PUSHTOKEN)

        expect(isOk).toBeTruthy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(1)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(1)
        expect(result.responses[0].status).toEqual(APS_RESPONSE_STATUS_SUCCESS)
        expect(result.responses[0].apnsId).toBeTruthy()
    })

    it.skip('tries to send VoIP push notification to real test VoIP push token if provided ', async () => {
        const token = APPLE_TEST_VOIP_PUSHTOKEN

        if (!token) return

        const tokens = [token]
        const payload = {
            tokens,
            notification: {
                title: 'Doma.ai',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                app: 'condo',
                type: 'notification',
            },
            appIds: { [token]: APP_RESIDENT_ID_IOS },
            pushTypes: { [token]: PUSH_TYPE_DEFAULT },
        }
        const [isOk, result] = await adapter.sendNotification(payload, token === APPLE_TEST_VOIP_PUSHTOKEN)

        expect(isOk).toBeTruthy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(1)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(1)
        expect(result.responses[0].status).toEqual(APS_RESPONSE_STATUS_SUCCESS)
        expect(result.responses[0].apnsId).toBeTruthy()
    })

    it('should fail sending push notification to fake fail push token ', async () => {
        const [isOk, result] = await adapter.sendNotification({
            tokens: [PUSH_FAKE_TOKEN_FAIL],
            notification: {
                title: 'Doma.ai',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                app : 'condo',
                type: 'notification',
            },
        })

        expect(isOk).toBeFalsy()
        expect(result).toBeDefined()
        expect(result.failureCount).toEqual(1)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(1)
        expect(result.responses[0].success).toBeFalsy()
        expect(result.responses[0].error).toBeDefined()
        expect(result.responses[0].error.reason).toEqual('fake-error')
        expect(result.responses[0].error['apns-id']).toMatch(FAKE_ERROR_MESSAGE_PREFIX_REGEXP)
    })

    it('should succeed sending push notification to fake success and fake fail push tokens', async () => {
        const [isOk, result] = await adapter.sendNotification({
            tokens: [PUSH_FAKE_TOKEN_SUCCESS, PUSH_FAKE_TOKEN_FAIL],
            notification: {
                title: 'Doma.ai',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                app : 'condo',
                type: 'notification',
            },
        })

        expect(isOk).toBeTruthy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(1)
        expect(result.failureCount).toEqual(1)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(2)
        expect(result.responses[0].success).toBeTruthy()
        expect(result.responses[0].headers['apns-id']).toMatch(FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP)
        expect(result.responses[0].headers[':status']).toEqual(APS_RESPONSE_STATUS_SUCCESS)
        expect(result.responses[1].success).toBeFalsy()
        expect(result.responses[1].error).toBeDefined()
        expect(result.responses[1].error.reason).toEqual('fake-error')
        expect(result.responses[1].error['apns-id']).toMatch(FAKE_ERROR_MESSAGE_PREFIX_REGEXP)
    })

    it('sends push notification of proper structure on pushType = PUSH_TYPE_DEFAULT', async () => {
        const tokens = [PUSH_FAKE_TOKEN_SUCCESS]
        const pushData = {
            tokens,
            notification: {
                title: 'Doma.ai',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                app : 'condo',
                type: 'notification',
            },
            pushTypes: {
                [PUSH_FAKE_TOKEN_SUCCESS]: PUSH_TYPE_DEFAULT,
            },
        }
        const [isOk, result] = await adapter.sendNotification(pushData)

        expect(isOk).toBeTruthy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(1)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(1)
        expect(result.pushContext).toBeDefined()

        const pushContext = result.pushContext[PUSH_TYPE_DEFAULT]

        expect(pushContext).toBeDefined()
        expect(pushContext.notification).toBeDefined()
        expect(pushContext.notification.title).toEqual(pushData.notification.title)
        expect(pushContext.notification.body).toEqual(pushData.notification.body)
    })

    it('sends push notification of proper structure on pushType = PUSH_TYPE_SILENT_DATA', async () => {
        const tokens = [PUSH_FAKE_TOKEN_SUCCESS]
        const pushData = {
            tokens,
            notification: {
                title: 'Doma.ai',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                app : 'condo',
                type: 'notification',
            },
            pushTypes: {
                [PUSH_FAKE_TOKEN_SUCCESS]: PUSH_TYPE_SILENT_DATA,
            },
        }
        const [isOk, result] = await adapter.sendNotification(pushData)

        expect(isOk).toBeTruthy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(1)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(1)
        expect(result.pushContext).toBeDefined()

        const pushContext = result.pushContext[PUSH_TYPE_SILENT_DATA]

        expect(pushContext).toBeDefined()
        expect(pushContext.notification).toBeUndefined()
        expect(pushContext.data).toBeDefined()
        expect(pushContext.data._title).toEqual(pushData.notification.title)
        expect(pushContext.data._body).toEqual(pushData.notification.body)
    })

    it('should fail to send invalid push notification with missing title to fake success push token ', async () => {
        await expect(
            adapter.sendNotification({
                tokens: [PUSH_FAKE_TOKEN_SUCCESS],
                notification: {
                    body: `${dayjs().format()} Condo greets you!`,
                },
                data: {
                    app : 'condo',
                    type: 'notification',
                },
            })
        ).rejects.toThrow(EMPTY_NOTIFICATION_TITLE_BODY_ERROR)
    })

    it('should fail to send invalid push notification with missing body to fake success push token ', async () => {
        await expect(
            adapter.sendNotification({
                tokens: [PUSH_FAKE_TOKEN_SUCCESS],
                notification: {
                    title: 'Doma.ai',
                },
                data: {
                    app : 'condo',
                    type: 'notification',
                },
            })
        ).rejects.toThrow(EMPTY_NOTIFICATION_TITLE_BODY_ERROR)
    })

    it('makes sure that PUSH notification data fields are all of string type (converted & normalized)', async () => {
        const data = {
            ticketId: faker.datatype.uuid(),
            ticketNumber: faker.datatype.number(8), // number type
            userId: faker.datatype.uuid(),
        }
        const preparedData = AppleAdapter.prepareData(data)

        expect(typeof preparedData.ticketNumber).toEqual('string')
    })

})
