const dayjs = require('dayjs')

const { FirebaseAdapter, FAKE_SUCCESS_MESSAGE_PREFIX } = require('./firebaseAdapter')
const { PUSH_FAKE_TOKEN_SUCCESS, PUSH_FAKE_TOKEN_FAIL } = require('@condo/domains/notification/constants/constants')

const adapter = new FirebaseAdapter()
const FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP = new RegExp(`^${FAKE_SUCCESS_MESSAGE_PREFIX}`)

describe('Firebase adapter utils', () => {
    it('should succeed sending push notification to fake success push token ', async () => {
        const [isOk, result] = await adapter.sendNotification({
            tokens: [PUSH_FAKE_TOKEN_SUCCESS],
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
        expect(result.responses.length).toEqual(1)
        expect(result.responses[0].success).toBeTruthy()
        expect(result.responses[0].messageId).toMatch(FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP)
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
        expect(result.responses.length).toEqual(1)
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
        expect(result.responses.length).toEqual(2)
        expect(result.responses[0].success).toBeTruthy()
        expect(result.responses[0].messageId).toMatch(FAKE_SUCCESS_MESSAGE_PREFIX_REGEXP)
        expect(result.responses[1].success).toBeFalsy()
        expect(result.responses[1].error).toBeDefined()
        expect(result.responses[1].error.errorInfo).toBeDefined()
        expect(result.responses[1].error.errorInfo.code).toBeDefined()
        expect(result.responses[1].error.errorInfo.message).toBeDefined()
    })

    it('should not fail to initialize FirebaseAdapter with nullish config and send fake success push', async () => {
        const adapter1 = new FirebaseAdapter(null)

        expect(adapter1.app).toBeNull()

        const [isOk, result] = await adapter1.sendNotification({
            tokens: [PUSH_FAKE_TOKEN_SUCCESS],
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
    })

    it('should fail to initialize FirebaseAdapter with broken config and send fake success push', async () => {
        const adapter1 = new FirebaseAdapter('{ someField: xxx,')

        expect(adapter1.app).toBeNull()

        const [isOk, result] = await adapter1.sendNotification({
            tokens: [PUSH_FAKE_TOKEN_SUCCESS],
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
        expect(result.error).toBeDefined()
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
        ).rejects.toThrow('No notification.title or notification.body')
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
        ).rejects.toThrow('No notification.title or notification.body')
    })

})
