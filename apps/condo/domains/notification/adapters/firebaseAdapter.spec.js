const dayjs = require('dayjs')
const faker = require('faker')

const conf = require('@core/config')

const {
    PUSH_FAKE_TOKEN_SUCCESS,
    PUSH_FAKE_TOKEN_FAIL,
    FIREBASE_CONFIG_TEST_PUSHTOKEN_ENV,
} = require('@condo/domains/notification/constants/constants')

const {
    FirebaseAdapter,
    FAKE_SUCCESS_MESSAGE_PREFIX,
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

    // it('should fail to initialize FirebaseAdapter with broken config', async () => {
    //     await expect(
    //         () => {
    //             const adapter1 = new FirebaseAdapter(BROKEN_CONFIG, true)
    //         }
    //     ).toThrow(`Failed to parse service account json file: Error: ENOENT: no such file or directory, open '${BROKEN_CONFIG}'`)
    // })
    //
    // it('should fail to initialize FirebaseAdapter with empty config', async () => {
    //     await expect(
    //         () => {
    //             const adapter1 = new FirebaseAdapter('', true)
    //         }
    //     ).toThrow(EMPTY_CONFIG_ERROR)
    // })

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
