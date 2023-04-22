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
} = require('@condo/domains/notification/constants/constants')

const {
    FirebaseAdapter,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
} = require('./firebaseAdapter')

const adapter = new FirebaseAdapter()
const FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP = new RegExp(`^${FAKE_SUCCESS_MESSAGE_PREFIX}`)
const FIREBASE_TEST_PUSHTOKEN = conf[FIREBASE_CONFIG_TEST_PUSHTOKEN_ENV] || null

describe('Firebase adapter utils', () => {
    it('should succeed sending push notification to fake success push token ', async () => {
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
        expect(result.responses[0].messageId).toMatch(FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP)
    })

    it('tries to send push notification to real test push token if provided ', async () => {
        if (!FIREBASE_TEST_PUSHTOKEN) return

        const tokens = [FIREBASE_TEST_PUSHTOKEN]
        const [isOk, result] = await adapter.sendNotification({
            tokens,
            notification: {
                title: 'Doma.ai',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                app: 'condo',
                type: 'notification',
            },
        })

        expect(isOk).toBeTruthy()
        expect(result).toBeDefined()
        expect(result.successCount).toEqual(1)
        expect(result.responses).toBeDefined()
        expect(result.responses).toHaveLength(1)
        expect(result.responses[0].success).toBeTruthy()
        expect(result.responses[0].messageId).toMatch(adapter.messageIdPrefixRegexp)
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
        expect(result.responses[0].error.errorInfo).toBeDefined()
        expect(result.responses[0].error.errorInfo.code).toBeDefined()
        expect(result.responses[0].error.errorInfo.message).toBeDefined()
    })

    it('should succeed sending push notification to fake success and fail push token ', async () => {
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
        const preparedData = FirebaseAdapter.prepareData(data)

        expect(typeof preparedData.ticketNumber).toEqual('string')
    })

})
