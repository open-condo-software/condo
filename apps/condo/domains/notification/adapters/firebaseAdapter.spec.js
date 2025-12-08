const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')

const {
    PUSH_FAKE_TOKEN_SUCCESS,
    PUSH_FAKE_TOKEN_FAIL,
    FIREBASE_CONFIG_TEST_PUSHTOKEN_ENV,
    PUSH_TYPE_SILENT_DATA,
    PUSH_TYPE_DEFAULT,
    FAKE_SUCCESS_MESSAGE_PREFIX,
    CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
    FIREBASE_DEFAULT_APP_ID,
} = require('@condo/domains/notification/constants/constants')

const {
    FirebaseAdapter,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
} = require('./firebaseAdapter')

const adapter = new FirebaseAdapter()
const FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP = new RegExp(`^${FAKE_SUCCESS_MESSAGE_PREFIX}`)
const FIREBASE_TEST_PUSHTOKEN = conf[FIREBASE_CONFIG_TEST_PUSHTOKEN_ENV] || null

jest.mock('@open-condo/config',  () => {
    const actual = jest.requireActual('@open-condo/config')
    return {
        ...actual,
        APPS_WITH_DISABLED_NOTIFICATIONS: '["condo.app.clients"]',
    }
})
describe('Firebase adapter utils', () => {
    it('should succeed sending push notification to fake success push token ', async () => {
        const tokens = [PUSH_FAKE_TOKEN_SUCCESS]
        const [isOk, result] = await adapter.sendNotification({
            tokens,
            notification: {
                title: 'Condo',
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
        expect(result.responses[0].messageId).toMatch(FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP)
    })

    it('tries to send push notification to real test push token if provided ', async () => {
        if (!FIREBASE_TEST_PUSHTOKEN) return

        const tokens = [FIREBASE_TEST_PUSHTOKEN]
        const [isOk, result] = await adapter.sendNotification({
            type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
            tokens,
            notification: {
                title: 'Condo',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                // app: 'condo',
                // type: 'notification',
                recurrentPaymentContextId: faker.datatype.uuid(),
                recurrentPaymentContext: { id: 'faker.datatype.uuid()' },
                errorCode: 'test2',
            },
        })

        expect(isOk).toBeTruthy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(1)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(1)
        expect(result.responses[0].success).toBeTruthy()
        expect(result.responses[0].messageId).toMatch(adapter.messageIdPrefixRegexpByAppId[FIREBASE_DEFAULT_APP_ID])
    })

    it('should fail sending push notification to fake fail push token ', async () => {
        const [isOk, result] = await adapter.sendNotification({
            tokens: [PUSH_FAKE_TOKEN_FAIL],
            notification: {
                title: 'Condo',
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
        expect(result.responses[0].error.errorInfo).toBeDefined()
        expect(result.responses[0].error.errorInfo.code).toBeDefined()
        expect(result.responses[0].error.errorInfo.message).toBeDefined()
    })

    it('should succeed sending push notification to fake success and fail push token ', async () => {
        const [isOk, result] = await adapter.sendNotification({
            tokens: [PUSH_FAKE_TOKEN_SUCCESS, PUSH_FAKE_TOKEN_FAIL],
            notification: {
                title: 'Condo',
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
        expect(result.responses[0].messageId).toMatch(FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP)
        expect(result.responses[1].success).toBeFalsy()
        expect(result.responses[1].error).toBeDefined()
        expect(result.responses[1].error.errorInfo).toBeDefined()
        expect(result.responses[1].error.errorInfo.code).toBeDefined()
        expect(result.responses[1].error.errorInfo.message).toBeDefined()
    })

    it('sends push notification of proper structure on pushType = PUSH_TYPE_DEFAULT', async () => {
        const tokens = [PUSH_FAKE_TOKEN_SUCCESS]
        const pushData = {
            tokens,
            notification: {
                title: 'Condo',
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
                title: 'Condo',
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

    it('doesnt send push notification to app with disabled notifications', async () => {
        const tokens = [PUSH_FAKE_TOKEN_SUCCESS]
        const pushData = {
            tokens,
            notification: {
                title: 'Condo',
                body: `${dayjs().format()} Condo greets you!`,
            },
            // data.app is set only in tests
            // in real flow data is set without data.app
            data: {
                app : 'condo.app.clients',
                type: 'notification',
            },
            pushTypes: {
                [PUSH_FAKE_TOKEN_SUCCESS]: PUSH_TYPE_SILENT_DATA,
            },
            appIds: {
                [PUSH_FAKE_TOKEN_SUCCESS]: 'condo.app.clients',
            },
        }
        const [isOk, result] = await adapter.sendNotification(pushData)

        expect(isOk).toBeFalsy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(0)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(0)
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
                    title: 'Condo',
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
        const preparedData = FirebaseAdapter.prepareData(data)

        expect(typeof preparedData.ticketNumber).toEqual('string')
    })

    describe('FirebaseAdapter.prepareBatchData', () => {
        const tokens = [PUSH_FAKE_TOKEN_SUCCESS]
        const notification = {
            title: 'Condo',
            body: `${dayjs().format()} Condo greets you!`,
        }
        const data = {
            app: 'condo',
            type: 'notification',
        }
        const appIds = {
            [PUSH_FAKE_TOKEN_SUCCESS]: 'condo.app.main',
        }

        const assertTopLevelFields = (entry, allowedFields) => {
            expect(entry).toBeDefined()
            Object.keys(entry).forEach((field) => {
                expect(allowedFields).toContain(field)
            })
        }

        const buildPayload = (pushType, isVoIP = false) => FirebaseAdapter.prepareBatchData(
            notification,
            data,
            tokens,
            { [PUSH_FAKE_TOKEN_SUCCESS]: pushType },
            isVoIP,
            appIds
        )

        it('prepares default payload without VoIP and keeps appIds out of pushData', () => {
            const [, , pushContext] = buildPayload(PUSH_TYPE_DEFAULT)
            const entry = pushContext[PUSH_TYPE_DEFAULT]

            expect(entry.notification).toBeDefined()
            expect(entry.android).toBeUndefined()
            expect(entry.appIds).toBeUndefined()

            assertTopLevelFields(entry, ['token', 'data', 'notification', 'apns', 'android'])
        })

        it('prepares default payload for VoIP with android priority while still hiding appIds', () => {
            const [, , pushContext] = buildPayload(PUSH_TYPE_DEFAULT, true)
            const entry = pushContext[PUSH_TYPE_DEFAULT]

            expect(entry.notification).toBeDefined()
            expect(entry.android).toBeDefined()
            expect(entry.android.priority).toEqual('high')
            expect(entry.appIds).toBeUndefined()

            assertTopLevelFields(entry, ['token', 'data', 'notification', 'apns', 'android'])
        })

        it('prepares silent payload without VoIP and excludes notification & appIds', () => {
            const [, , pushContext] = buildPayload(PUSH_TYPE_SILENT_DATA)
            const entry = pushContext[PUSH_TYPE_SILENT_DATA]

            expect(entry.notification).toBeUndefined()
            expect(entry.android).toBeUndefined()
            expect(entry.data._title).toEqual(notification.title)
            expect(entry.data._body).toEqual(notification.body)
            expect(entry.appIds).toBeUndefined()

            assertTopLevelFields(entry, ['token', 'data', 'apns', 'android'])
        })

        it('prepares silent payload with VoIP, adds android priority and keeps appIds hidden', () => {
            const [, , pushContext] = buildPayload(PUSH_TYPE_SILENT_DATA, true)
            const entry = pushContext[PUSH_TYPE_SILENT_DATA]

            expect(entry.notification).toBeUndefined()
            expect(entry.android).toBeDefined()
            expect(entry.android.priority).toEqual('high')
            expect(entry.appIds).toBeUndefined()

            assertTopLevelFields(entry, ['token', 'data', 'apns', 'android'])
        })
    })

})
