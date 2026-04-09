/**
 * @jest-environment node
 */
jest.mock('@open-condo/config', () => {
    const actual = jest.requireActual('@open-condo/config')
    const mockedValues = {
        TESTS_FAKE_WORKER_MODE: true,
        PUSH_ADAPTER_SETTINGS: JSON.stringify({
            encryption: {
                'test-encrypted-app-with-invalid-version': 'non-existent-encryption-version',
                'test-encrypted-app': 'v1',
            },
            groups: {
                group_1: ['appId_1', 'appId_2', 'appId_3'],
                group_2: ['appId_4', 'appId_5'],
                group_3: ['appId_6'],
            },
            transportPriorityByAppId: {
                'test-app-transport-only-apple': { 'isVoIP': ['apple'], 'isPush': ['apple'] },
                'test-app-transport-only-huawei': { 'isVoIP': ['huawei'], 'isPush': ['huawei'] },
            },
        }),
    }
    return new Proxy(actual, {
        set () {},
        get (_, p) {
            if (p in mockedValues) {
                return mockedValues[p]
            }
            if (p === 'PUSH_MESSAGE_OVERRIDES') {
                return global.__pushMessageOverrides || actual[p]
            }
            return actual[p]
        },
    })
})
const ENCRYPTED_APP_ID = 'test-encrypted-app'
const ALWAYS_INVALID_ENCRYPTION_APP_ID = 'test-encrypted-app-with-invalid-version'
const TEST_ENCRYPTION_VERSIONS = {
    [ENCRYPTED_APP_ID]: 'v1',
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PUSH_NOTIFICATION_APP_GROUPS_SETTINGS = {
    group_1: ['appId_1', 'appId_2', 'appId_3'],
    group_2: ['appId_4', 'appId_5'],
    group_3: ['appId_6'],
}

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')

const { DATE_FORMAT_Z } = require('@condo/domains/common/utils/date')
const { AppleAdapter } = require('@condo/domains/notification/adapters/appleAdapter')
const { FirebaseAdapter } = require('@condo/domains/notification/adapters/firebaseAdapter')
const { PUSH_SUCCESS_CODE, PUSH_PARTIAL_SUCCESS_CODE, ALL_TOKENS_ARE_INVALID_CODE } = require('@condo/domains/notification/adapters/hcm/constants')
const { HCMAdapter } = require('@condo/domains/notification/adapters/hcmAdapter')
const { OneSignalAdapter } = require('@condo/domains/notification/adapters/oneSignalAdapter')
const { RedStoreAdapter } = require('@condo/domains/notification/adapters/redStoreAdapter')
const {
    BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE,
    CUSTOM_CONTENT_MESSAGE_TYPE,
    CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
    DEVICE_PLATFORM_ANDROID,
    PUSH_TRANSPORT_FIREBASE,
    PUSH_TRANSPORT_APPLE,
    PUSH_TRANSPORT_ONESIGNAL,
    PUSH_TRANSPORT_REDSTORE,
    PUSH_TRANSPORT_HUAWEI,
    PUSH_TYPE_DEFAULT,
    PUSH_TYPE_SILENT_DATA,
    HUAWEI_APP_TYPE_BY_APP_ID,
    APP_RESIDENT_ID_ANDROID,
    APP_MASTER_ID_ANDROID,
    MESSAGE_SENT_STATUS,
    MESSAGE_ERROR_STATUS,
    PUSH_TRANSPORT, DEVICE_PLATFORM_TYPES, PUSH_TRANSPORT_TYPES, PUSH_TRANSPORT_WEBHOOK,
    REMOTE_CLIENT_GROUP_UNGROUPED,
    PUSH_FAKE_TOKEN_FAIL,
} = require('@condo/domains/notification/constants/constants')
const { prepareMessageData } = require('@condo/domains/notification/tasks/sendMessageBatch.helpers')
const { Message, sendMessageByTestClient, syncRemoteClientByTestClient, RemoteClient, RemoteClientPushToken } = require('@condo/domains/notification/utils/testSchema')
const { getRandomTokenData, getRandomFakeSuccessToken, getRandomFakeFailToken } = require('@condo/domains/notification/utils/testSchema/utils')
const { makeClientWithResidentUser, makeClientWithStaffUser } = require('@condo/domains/user/utils/testSchema')



function mockGetTokensModule (mockGetTokens) {
    jest.doMock('@condo/domains/notification/utils/serverSchema/push/helpers', () => {
        const actual = jest.requireActual('@condo/domains/notification/utils/serverSchema/push/helpers')
        return {
            ...actual,
            getTokens: mockGetTokens,
        }
    })
}

function unmockGetTokensModule () {
    jest.unmock('@condo/domains/notification/utils/serverSchema/push/helpers')
}

function mockFirebaseAdapterModule (mockFirebaseAdapter) {
    jest.doMock('@condo/domains/notification/adapters/firebaseAdapter', () => ({
        FirebaseAdapter: jest.fn(() => mockFirebaseAdapter),
    }))
}

function unmockFirebaseAdapterModule () {
    jest.unmock('@condo/domains/notification/adapters/firebaseAdapter')
}

function mockAppleAdapterModule (mockAppleAdapter) {
    jest.doMock('@condo/domains/notification/adapters/appleAdapter', () => ({
        AppleAdapter: jest.fn(() => mockAppleAdapter),
    }))
}

function unmockAppleAdapterModule () {
    jest.unmock('@condo/domains/notification/adapters/appleAdapter')
}

function requirePushTransportIsolated () {
    let pushTransport
    jest.isolateModules(() => {
        pushTransport = require('@condo/domains/notification/transports/push')
    })
    return pushTransport
}


describe('push transport', () => {
    setFakeClientMode(index)

    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('getTokens selection (multiple tokens & transportPriorityByAppId)', () => {
        const testMessageType = BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE

        /** @type {jest.MockedFunction<any>} */
        let sendNotificationFirebaseSpy
        /** @type {jest.MockedFunction<any>} */
        let sendNotificationAppleSpy

        beforeEach(() => {
            jest.resetModules()

            sendNotificationFirebaseSpy = jest.fn(async (payload) => {
                return new FirebaseAdapter().sendNotification(payload)
            })

            sendNotificationAppleSpy = jest.fn(async (payload) => {
                return new AppleAdapter().sendNotification(payload)
            })

            const mockFirebaseAdapter = {
                constructor: {
                    prepareData: jest.fn((...args) => FirebaseAdapter.prepareData(...args)),
                    validateAndPrepareNotification: jest.fn((...args) => FirebaseAdapter.validateAndPrepareNotification(...args)),
                },
                sendNotification: sendNotificationFirebaseSpy,
            }

            const mockAppleAdapter = {
                constructor: {
                    prepareData: jest.fn((...args) => AppleAdapter.prepareData(...args)),
                    validateAndPrepareNotification: jest.fn((...args) => AppleAdapter.validateAndPrepareNotification(...args)),
                },
                sendNotification: sendNotificationAppleSpy,
            }

            mockFirebaseAdapterModule(mockFirebaseAdapter)
            mockAppleAdapterModule(mockAppleAdapter)

            jest.doMock('@open-condo/keystone/schema', () => {
                return {
                    find: async (schemaName, where) => getSchemaCtx(schemaName).list.adapter.find(where),
                }
            })

        })

        afterEach(() => {
            unmockFirebaseAdapterModule()
            unmockAppleAdapterModule
            jest.unmock('@open-condo/keystone/schema')
        })

        test('sends push only to one token when RemoteClient has multiple isPush tokens (restricted by transportPriorityByAppId)', async () => {
            const client = await makeClientWithResidentUser()

            const tokenApple = getRandomFakeSuccessToken()
            const tokenFirebase = getRandomFakeSuccessToken()

            const payload = getRandomTokenData({
                appId: 'test-app-transport-only-apple',
                pushToken: null,
                pushTransport: null,
                pushTokenVoIP: null,
                pushTransportVoIP: null,
                meta: null,
                pushTokens: [
                    { token: tokenFirebase, transport: PUSH_TRANSPORT_FIREBASE, isPush: true, isVoIP: false },
                    { token: tokenApple, transport: 'apple', isPush: true, isVoIP: false },
                ],
            })

            const [remoteClient] = await syncRemoteClientByTestClient(client, payload)

            const pushTransport = requirePushTransportIsolated()

            const [isOk] = await pushTransport.send({
                data: { notificationId: faker.datatype.uuid(), type: testMessageType, messageCreatedAt: new Date().toISOString() },
                message: { id: faker.datatype.uuid(), type: testMessageType, lang: conf.DEFAULT_LOCALE, meta: { dv: 1, data: {} } },
                remoteClient: { id: remoteClient.id },
            })

            expect(isOk).toEqual(true)
            expect(sendNotificationAppleSpy).toHaveBeenCalledTimes(1)
            expect(sendNotificationFirebaseSpy).not.toHaveBeenCalled()
            const calledPayload = sendNotificationAppleSpy.mock.calls[0][0]
            expect(calledPayload.tokens).toEqual([tokenApple])
        })

        test('does not send push when transportPriorityByAppId does not allow any available token transports', async () => {
            const client = await makeClientWithResidentUser()

            const tokenFirebase = getRandomFakeSuccessToken()

            const payload = getRandomTokenData({
                appId: 'test-app-transport-only-huawei',
                pushToken: null,
                pushTransport: null,
                pushTokenVoIP: null,
                pushTransportVoIP: null,
                meta: null,
                pushTokens: [
                    { token: tokenFirebase, transport: PUSH_TRANSPORT_FIREBASE, isPush: true, isVoIP: false },
                ],
            })

            const [remoteClient] = await syncRemoteClientByTestClient(client, payload)

            const pushTransport = requirePushTransportIsolated()

            const [isOk, result] = await pushTransport.send({
                data: { notificationId: faker.datatype.uuid(), type: testMessageType, messageCreatedAt: new Date().toISOString() },
                message: { id: faker.datatype.uuid(), type: testMessageType, lang: conf.DEFAULT_LOCALE, meta: { dv: 1, data: {} } },
                remoteClient: { id: remoteClient.id },
            })

            expect(isOk).toEqual(false)
            expect(sendNotificationAppleSpy).not.toHaveBeenCalled()
            expect(sendNotificationFirebaseSpy).not.toHaveBeenCalled()
            expect(result).toMatchObject({
                error: 'No pushTokens available.',
            })
        })
    })

    describe('Huawei', () => {
        describe('to resident', () => {
            it('successfully sends fake ordinary notification of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const residentUser = await makeClientWithResidentUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    appId: APP_RESIDENT_ID_ANDROID,
                    pushToken: getRandomFakeSuccessToken(),
                })

                await syncRemoteClientByTestClient(residentUser, payload)

                const target = residentUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                transportMeta = message.processingMeta.transportsMeta[0]

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses).toHaveLength(1)
                expect(responses[0].code).toEqual(PUSH_SUCCESS_CODE)
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].appType).toEqual(HUAWEI_APP_TYPE_BY_APP_ID[payload.appId])
                expect(responses[0].pushToken).toEqual(payload.pushToken)
                expect(successCount).toEqual(1)
                expect(failureCount).toEqual(0)
                expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)

            })

            it('successfully sends messages with quotes', async () => {
                const residentUser = await makeClientWithResidentUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    appId: APP_RESIDENT_ID_ANDROID,
                    pushToken: getRandomFakeSuccessToken(),
                })

                await syncRemoteClientByTestClient(residentUser, payload)

                const target = residentUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: 'Test message with "quotes"',
                    message: 'Test message with "quotes"',
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                transportMeta = message.processingMeta.transportsMeta[0]

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses).toHaveLength(1)
                expect(responses[0].code).toEqual(PUSH_SUCCESS_CODE)
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].appType).toEqual(HUAWEI_APP_TYPE_BY_APP_ID[payload.appId])
                expect(responses[0].pushToken).toEqual(payload.pushToken)
                expect(successCount).toEqual(1)
                expect(failureCount).toEqual(0)
                expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
            })

            it('fails to send fake ordinary notification of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const residentUser = await makeClientWithResidentUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    appId: APP_RESIDENT_ID_ANDROID,
                    pushToken: getRandomFakeFailToken(),
                })

                await syncRemoteClientByTestClient(residentUser, payload)

                const target = residentUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_ERROR_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                transportMeta = message.processingMeta.transportsMeta[0]

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses).toHaveLength(1)
                expect(responses[0].code).toEqual(PUSH_PARTIAL_SUCCESS_CODE)
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].appType).toEqual(HUAWEI_APP_TYPE_BY_APP_ID[payload.appId])
                expect(responses[0].pushToken).toEqual(payload.pushToken)
                expect(successCount).toEqual(0)
                expect(failureCount).toEqual(1)
                expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)

            })

            it('successfully sends fake silent data notification of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const residentUser = await makeClientWithResidentUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    appId: APP_MASTER_ID_ANDROID,
                    pushToken: getRandomFakeSuccessToken(),
                    pushType: PUSH_TYPE_SILENT_DATA,
                })

                await syncRemoteClientByTestClient(residentUser, payload)

                const target = residentUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                transportMeta = message.processingMeta.transportsMeta[0]

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses).toHaveLength(1)
                expect(responses[0].code).toEqual(PUSH_SUCCESS_CODE)
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].appType).toEqual(HUAWEI_APP_TYPE_BY_APP_ID[payload.appId])
                expect(responses[0].pushToken).toEqual(payload.pushToken)
                expect(successCount).toEqual(1)
                expect(failureCount).toEqual(0)
                expect(pushContext[PUSH_TYPE_SILENT_DATA]).toBeDefined()
                expect(pushContext[PUSH_TYPE_SILENT_DATA].notification).toBeUndefined()
                expect(pushContext[PUSH_TYPE_SILENT_DATA].data).toBeDefined()

                const data = JSON.parse(pushContext[PUSH_TYPE_SILENT_DATA].data)

                expect(data._body).toEqual(batch.message)
                expect(data._title).toEqual(batch.title)
            })
        })

        describe('to master', () => {
            it('successfully sends fake ordinary notification of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const staffUser = await makeClientWithStaffUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    appId: APP_MASTER_ID_ANDROID,
                    pushToken: getRandomFakeSuccessToken(),
                })

                await syncRemoteClientByTestClient(staffUser, payload)

                const target = staffUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                transportMeta = message.processingMeta.transportsMeta[0]

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses).toHaveLength(1)
                expect(responses[0].code).toEqual(PUSH_SUCCESS_CODE)
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].appType).toEqual(HUAWEI_APP_TYPE_BY_APP_ID[payload.appId])
                expect(responses[0].pushToken).toEqual(payload.pushToken)
                expect(successCount).toEqual(1)
                expect(failureCount).toEqual(0)
                expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)

            })

            it('fails to send fake ordinary notification of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const staffUser = await makeClientWithStaffUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    appId: APP_MASTER_ID_ANDROID,
                    pushToken: getRandomFakeFailToken(),
                })

                await syncRemoteClientByTestClient(staffUser, payload)

                const target = staffUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_ERROR_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                transportMeta = message.processingMeta.transportsMeta[0]

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses).toHaveLength(1)
                expect(responses[0].code).toEqual(PUSH_PARTIAL_SUCCESS_CODE)
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].appType).toEqual(HUAWEI_APP_TYPE_BY_APP_ID[payload.appId])
                expect(responses[0].pushToken).toEqual(payload.pushToken)
                expect(successCount).toEqual(0)
                expect(failureCount).toEqual(1)
                expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)

            })

            it('successfully sends fake silent data notification of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const staffUser = await makeClientWithStaffUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    appId: APP_MASTER_ID_ANDROID,
                    pushToken: getRandomFakeSuccessToken(),
                    pushType: PUSH_TYPE_SILENT_DATA,
                })

                await syncRemoteClientByTestClient(staffUser, payload)

                const target = staffUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                transportMeta = message.processingMeta.transportsMeta[0]

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses).toHaveLength(1)
                expect(responses[0].code).toEqual(PUSH_SUCCESS_CODE)
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].appType).toEqual(HUAWEI_APP_TYPE_BY_APP_ID[payload.appId])
                expect(responses[0].pushToken).toEqual(payload.pushToken)
                expect(successCount).toEqual(1)
                expect(failureCount).toEqual(0)
                expect(pushContext[PUSH_TYPE_SILENT_DATA]).toBeDefined()
                expect(pushContext[PUSH_TYPE_SILENT_DATA].notification).toBeUndefined()
                expect(pushContext[PUSH_TYPE_SILENT_DATA].data).toBeDefined()

                const data = JSON.parse(pushContext[PUSH_TYPE_SILENT_DATA].data)

                expect(data._body).toEqual(batch.message)
                expect(data._title).toEqual(batch.title)
            })
        })
    })

    describe('notificationByToken', () => {
        const mockGetTokens = jest.fn()

        const APP_ID_WITH_NO_OVERRIDES = 'app-id-with-no-overrides'
        const APP_ID_EMPTY_OVERRIDES = 'app-id-empty-overrides'
        const APP_ID_WITH_OVERRIDES_OK = 'app-id-with-overrides-ok'

        const testMessageType = BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE

        const tokenNoReplacers = 'token-no-overrides'
        const tokenEmptyReplacers = 'token-empty-overrides'
        const tokenReplacersOk = 'token-overrides-ok'

        /** @type {jest.MockedFunction<any>} */
        let sendNotificationSpy

        beforeEach(() => {
            jest.resetModules()
            mockGetTokens.mockReset()

            global.__pushMessageOverrides = JSON.stringify({
                [APP_ID_EMPTY_OVERRIDES]: {},
                [APP_ID_WITH_OVERRIDES_OK]: {
                    [conf.DEFAULT_LOCALE]: {
                        [`notification.messages.${testMessageType}.${PUSH_TRANSPORT}.title`]: 'custom title',
                        [`notification.messages.${testMessageType}.${PUSH_TRANSPORT}.body`]: 'custom body',
                    },
                },
            })

            mockGetTokensModule(mockGetTokens)

            sendNotificationSpy = jest.fn(async (payload) => {
                return [true, {
                    successCount: payload.tokens.length,
                    failureCount: 0,
                    responses: payload.tokens.map(token => ({ success: true, pushToken: token })),
                }]
            })

            const mockFirebaseAdapter = {
                constructor: {
                    prepareData: jest.fn((data, token) => FirebaseAdapter.prepareData(data, token)),
                    validateAndPrepareNotification: jest.fn((notification) => FirebaseAdapter.validateAndPrepareNotification(notification)),
                },
                sendNotification: sendNotificationSpy,
            }

            mockFirebaseAdapterModule(mockFirebaseAdapter)
        })

        afterEach(() => {
            unmockFirebaseAdapterModule()
            unmockGetTokensModule()
        })

        test('does not send push for tokens whose appId has overrides but missing translation for message.type', async () => {
            mockGetTokens.mockResolvedValue([{
                appId: APP_ID_EMPTY_OVERRIDES,
                token: tokenEmptyReplacers,
                transport: PUSH_TRANSPORT_FIREBASE,
                pushType: PUSH_TYPE_DEFAULT,
                remoteClientMeta: {},
            }])

            const pushTransport = requirePushTransportIsolated()

            const [isOk, result] = await pushTransport.send({
                data: { notificationId: faker.datatype.uuid(), type: testMessageType, messageCreatedAt: new Date().toISOString() },
                message: {
                    id: faker.datatype.uuid(),
                    type: testMessageType,
                    lang: conf.DEFAULT_LOCALE,
                    meta: { dv: 1, data: { categoryId: faker.datatype.uuid() } },
                },
                user: { id: faker.datatype.uuid() },
                remoteClient: { id: faker.datatype.uuid() },
            })

            expect(isOk).toEqual(false)
            expect(sendNotificationSpy).not.toHaveBeenCalled()
            expect(result.successCount).toEqual(0)
            expect(result.failureCount).toEqual(1)
            expect(result.responses).toHaveLength(1)
            expect(result.responses[0]).toMatchObject({
                success: false,
                pushToken: tokenEmptyReplacers,
                appId: APP_ID_EMPTY_OVERRIDES,
                error: 'empty notification for token',
            })
        })

        test('sends notifications for tokens without overrides and with valid overrides; skips tokens with missing type translation', async () => {
            mockGetTokens.mockResolvedValue([
                {
                    appId: APP_ID_WITH_NO_OVERRIDES,
                    token: tokenNoReplacers,
                    pushType: PUSH_TYPE_DEFAULT,
                    transport: PUSH_TRANSPORT_FIREBASE,
                    remoteClientMeta: {},
                }, 
                {
                    appId: APP_ID_EMPTY_OVERRIDES,
                    token: tokenEmptyReplacers,
                    pushType: PUSH_TYPE_DEFAULT,
                    transport: PUSH_TRANSPORT_FIREBASE,
                    remoteClientMeta: {},

                },
                {
                    appId: APP_ID_WITH_OVERRIDES_OK,
                    token: tokenReplacersOk,
                    pushType: PUSH_TYPE_DEFAULT,
                    transport: PUSH_TRANSPORT_FIREBASE,
                    remoteClientMeta: {},
                },
            ])

            const pushTransport = requirePushTransportIsolated()

            const [isOk, result] = await pushTransport.send({
                data: { notificationId: faker.datatype.uuid(), type: testMessageType, messageCreatedAt: new Date().toISOString(), hello: 'world' },
                message: {
                    id: faker.datatype.uuid(),
                    type: testMessageType,
                    lang: conf.DEFAULT_LOCALE,
                    meta: { dv: 1, data: { categoryId: faker.datatype.uuid() } },
                },
                user: { id: faker.datatype.uuid() },
                remoteClient: { id: faker.datatype.uuid() },
            })

            expect(isOk).toEqual(true)

            expect(sendNotificationSpy).toHaveBeenCalledTimes(1)

            const payload = sendNotificationSpy.mock.calls[0][0]
            expect(payload.tokens).toEqual([tokenNoReplacers, tokenReplacersOk])

            expect(payload.notificationByToken[tokenReplacersOk]).toMatchObject({
                title: 'custom title',
                body: 'custom body',
            })
            expect(payload.notificationByToken[tokenNoReplacers]).toBeDefined()
            expect(payload.notificationByToken[tokenNoReplacers]).not.toMatchObject({
                title: 'custom title',
                body: 'custom body',
            })

            expect(result.failureCount).toEqual(1)
            expect(result.responses.find(r => r.pushToken === tokenEmptyReplacers)).toMatchObject({
                success: false,
                error: 'empty notification for token',
            })
        })
    })

    describe('FireBase', () => {
        describe('to resident', () => {
            it('successfully sends fake ordinary notification of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const residentUser = await makeClientWithResidentUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_FIREBASE,
                    appId: APP_RESIDENT_ID_ANDROID,
                    pushToken: getRandomFakeSuccessToken(),
                })

                await syncRemoteClientByTestClient(residentUser, payload)

                const target = residentUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses.length).toBeGreaterThan(0)
                expect(responses[0].success).toBeTruthy()
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].messageId).toBeDefined()
                expect(successCount).toEqual(1)
                expect(failureCount).toEqual(0)
                expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)

            })

            it('fails to send fake ordinary notification of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const residentUser = await makeClientWithResidentUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_FIREBASE,
                    appId: APP_RESIDENT_ID_ANDROID,
                    pushToken: getRandomFakeFailToken(),
                })

                await syncRemoteClientByTestClient(residentUser, payload)

                const target = residentUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_ERROR_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses.length).toBeGreaterThan(0)
                expect(responses[0].success).toBeFalsy()
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].error).toBeDefined()
                expect(successCount).toEqual(0)
                expect(failureCount).toEqual(1)
                expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)

            })

            it('successfully sends fake silent data notification of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const residentUser = await makeClientWithResidentUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_FIREBASE,
                    appId: APP_RESIDENT_ID_ANDROID,
                    pushToken: getRandomFakeSuccessToken(),
                    pushType: PUSH_TYPE_SILENT_DATA,
                })

                await syncRemoteClientByTestClient(residentUser, payload)

                const target = residentUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses.length).toBeGreaterThan(0)
                expect(responses[0].success).toBeTruthy()
                expect(responses[0].type).toEqual('Fake')
                expect(responses[0].messageId).toBeDefined()
                expect(successCount).toEqual(1)
                expect(failureCount).toEqual(0)
                expect(pushContext[PUSH_TYPE_SILENT_DATA]).toBeDefined()
                expect(pushContext[PUSH_TYPE_SILENT_DATA].notification).toBeUndefined()
                expect(pushContext[PUSH_TYPE_SILENT_DATA].data).toBeDefined()

                const data = pushContext[PUSH_TYPE_SILENT_DATA].data

                expect(data._body).toEqual(batch.message)
                expect(data._title).toEqual(batch.title)
            })
        })
    })
    describe('FireBase + Huawei', () => {
        describe('to resident', () => {
            it('successfully sends mixed fake ordinary and silent data notifications of CUSTOM_CONTENT_MESSAGE_TYPE', async () => {
                const residentUser = await makeClientWithResidentUser()
                const payload = getRandomTokenData({
                    devicePlatform: DEVICE_PLATFORM_ANDROID,
                    pushTransport: PUSH_TRANSPORT_FIREBASE,
                    appId: APP_RESIDENT_ID_ANDROID,
                    pushToken: getRandomFakeSuccessToken(),
                })
                const payload1 = {
                    ...payload,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    deviceId: faker.datatype.uuid(),
                    pushToken: getRandomFakeSuccessToken(),
                }
                const payload2 = {
                    ...payload,
                    pushTransport: PUSH_TRANSPORT_FIREBASE,
                    deviceId: faker.datatype.uuid(),
                    pushToken: getRandomFakeSuccessToken(),
                    pushType: PUSH_TYPE_SILENT_DATA,
                }
                const payload3 = {
                    ...payload,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    deviceId: faker.datatype.uuid(),
                    pushToken: getRandomFakeSuccessToken(),
                    pushType: PUSH_TYPE_SILENT_DATA,
                }
                const payload4 = {
                    ...payload,
                    pushTransport: PUSH_TRANSPORT_FIREBASE,
                    deviceId: faker.datatype.uuid(),
                    pushToken: getRandomFakeFailToken(),
                }
                const payload5 = {
                    ...payload,
                    pushTransport: PUSH_TRANSPORT_HUAWEI,
                    deviceId: faker.datatype.uuid(),
                    pushToken: getRandomFakeFailToken(),
                }

                await syncRemoteClientByTestClient(residentUser, payload)
                await syncRemoteClientByTestClient(residentUser, payload1)
                await syncRemoteClientByTestClient(residentUser, payload2)
                await syncRemoteClientByTestClient(residentUser, payload3)
                await syncRemoteClientByTestClient(residentUser, payload4)
                await syncRemoteClientByTestClient(residentUser, payload5)

                const target = residentUser.user.id
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT_Z)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toEqual(0)

                const [messageStatus] = await sendMessageByTestClient(admin, messageData)

                expect(messageStatus.isDuplicateMessage).toBeFalsy()

                const messageWhere = {
                    type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                    uniqKey: messageData.uniqKey,
                }

                let message, transportMeta

                await waitFor(async () => {
                    message = await Message.getOne(admin, messageWhere)
                    transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message).toBeDefined()
                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                })

                const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

                expect(responses).toHaveLength(6)

                expect(successCount).toEqual(4)
                expect(failureCount).toEqual(2)

                expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
                expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)
                expect(pushContext[PUSH_TYPE_SILENT_DATA]).toBeDefined()
                expect(pushContext[PUSH_TYPE_SILENT_DATA].notification).toBeUndefined()
                expect(pushContext[PUSH_TYPE_SILENT_DATA].data).toBeDefined()

                const data = pushContext[PUSH_TYPE_SILENT_DATA].data

                expect(data._body).toEqual(batch.message)
                expect(data._title).toEqual(batch.title)

                const responsesByTransportAdapterType = responses.reduce((byType, response) => {
                    const adapterType = response.transport
                    if (!byType[adapterType]) byType[adapterType] = []
                    byType[adapterType].push(response)
                    return byType
                }, {})
                expect(Object.keys(responsesByTransportAdapterType)).toHaveLength(2)
                expect(responsesByTransportAdapterType[PUSH_TRANSPORT_FIREBASE]).toHaveLength(3)
                expect(responsesByTransportAdapterType[PUSH_TRANSPORT_HUAWEI]).toHaveLength(3)
            })
        })
    })

    describe('Encryption', () => {

        const mockGetTokens = jest.fn()
        // Create a mock adapter to capture the sendNotification call
        const mockFirebaseAdapter = {
            constructor: {
                prepareData: jest.fn((data, token) => FirebaseAdapter.prepareData(data, token)),
                validateAndPrepareNotification: jest.fn((...args) => FirebaseAdapter.validateAndPrepareNotification(...args)),
            },
            sendNotification: jest.fn(async (payload) => {
                return new FirebaseAdapter().sendNotification(payload)
            }),
        }
        const testMessageId = faker.datatype.uuid()
        const testGenericSendPushArguments = {
            id: faker.datatype.uuid(),
            type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE, createdAt: new Date().toISOString(),
            data: { notificationId: testMessageId, message: faker.random.alphaNumeric(10), title: faker.random.alphaNumeric(10), type: CUSTOM_CONTENT_MESSAGE_TYPE },
            user: { id: faker.datatype.uuid() },
            message: { id: testMessageId, type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE, lang: conf.DEFAULT_LOCALE, meta: { title: faker.random.alphaNumeric(10), body: faker.random.alphaNumeric(10) } },
        }

        beforeAll(() => {
            // Mock modules
            mockGetTokensModule(mockGetTokens)
            mockFirebaseAdapterModule(mockFirebaseAdapter)
        })

        afterEach(() => {
            mockGetTokens.mockReset()
            mockFirebaseAdapter.constructor.prepareData.mockClear()
            mockFirebaseAdapter.sendNotification.mockClear()
        })

        afterAll(() => {
            unmockGetTokensModule()
            unmockFirebaseAdapterModule()
        })

        it('should encrypt data when sending to encrypted app', async () => {
            const token = getRandomFakeSuccessToken()
            // Mock the getTokens function
            mockGetTokens.mockResolvedValue([{
                appId: ENCRYPTED_APP_ID,
                transport: PUSH_TRANSPORT_FIREBASE,
                token,
                pushType: PUSH_TYPE_DEFAULT,
            }])

            // Reload push transport to apply the mocks
            jest.resetModules()
            const { send } = require('@condo/domains/notification/transports/push')

            // Call send function
            const [isOk] = await send(testGenericSendPushArguments)
            expect(isOk).toBe(true)

            // Verify that encryption happened correctly
            const callArgs = mockFirebaseAdapter.sendNotification.mock.calls[0][0]
            const { dataByToken } = callArgs

            // The data should be encrypted under the appId key
            expect(dataByToken[token][ENCRYPTED_APP_ID]).toBeDefined()
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
            expect(dataByToken[token][ENCRYPTED_APP_ID]).toMatch(new RegExp(`^${TEST_ENCRYPTION_VERSIONS[ENCRYPTED_APP_ID]}_`)) // NOSONAR
        })

        it('should encrypt data for encrypted app but not for other apps when sending to both', async () => {
            const encryptedToken = getRandomFakeSuccessToken()
            const regularToken = getRandomFakeSuccessToken()
            // Mock the getTokens function
            mockGetTokens.mockResolvedValue([
                {
                    token: encryptedToken,
                    appId: ENCRYPTED_APP_ID,
                    pushType: PUSH_TYPE_DEFAULT,
                    transport: PUSH_TRANSPORT_FIREBASE,
                }, {
                    token: regularToken,
                    appId: APP_RESIDENT_ID_ANDROID,
                    pushType: PUSH_TYPE_DEFAULT,
                    transport: PUSH_TRANSPORT_FIREBASE,
                },
            ])

            // Reload push transport to apply the mocks
            jest.resetModules()
            const { send } = require('@condo/domains/notification/transports/push')

            // Call send function
            const [isOk] = await send(testGenericSendPushArguments)
            // Verify the results
            expect(isOk).toBe(true)

            // Verify that encryption happened correctly for encrypted app
            const callArgs = mockFirebaseAdapter.sendNotification.mock.calls[0][0]
            const { dataByToken } = callArgs

            expect(Object.keys(dataByToken)).toHaveLength(2)
            // Check encrypted app data
            expect(dataByToken[encryptedToken][ENCRYPTED_APP_ID]).toBeDefined()
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
            expect(dataByToken[encryptedToken][ENCRYPTED_APP_ID]).toMatch(new RegExp(`^${TEST_ENCRYPTION_VERSIONS[ENCRYPTED_APP_ID]}_`)) // NOSONAR

            // Check regular app data - should not be encrypted
            expect(dataByToken[regularToken][ENCRYPTED_APP_ID]).toBeUndefined()
            expect(dataByToken[regularToken]).toEqual(expect.objectContaining(testGenericSendPushArguments.data))
        })

        it('should not send push to app if encryption fails', async () => {
            const invalidEncryptionToken = getRandomFakeSuccessToken()
            // Mock the getTokens function
            mockGetTokens.mockResolvedValue([
                {
                    token: invalidEncryptionToken,
                    appId: ALWAYS_INVALID_ENCRYPTION_APP_ID,
                    pushType: PUSH_TYPE_DEFAULT,
                    transport: PUSH_TRANSPORT_FIREBASE,
                },
            ])

            // Reload push transport to apply the mocks
            jest.resetModules()
            const { send } = require('@condo/domains/notification/transports/push')

            // Call send function
            const [isOk, result] = await send(testGenericSendPushArguments)

            // Verify the results
            expect(isOk).toBe(false)
            expect(mockFirebaseAdapter.sendNotification).not.toHaveBeenCalled()

            expect(result.successCount).toBe(0)
            expect(result.failureCount).toBe(1)
        })

        it('should skip apps when encryption fails', async () => {
            const invalidEncryptionToken = getRandomFakeSuccessToken()
            const encryptedToken = getRandomFakeSuccessToken()
            const regularToken = getRandomFakeSuccessToken()

            // Mock the getTokens function
            mockGetTokens.mockResolvedValue([
                {
                    token: invalidEncryptionToken,
                    appId: ALWAYS_INVALID_ENCRYPTION_APP_ID,
                    pushType: PUSH_TYPE_DEFAULT,
                    transport: PUSH_TRANSPORT_FIREBASE,
                },
                {
                    token: encryptedToken,
                    appId: ENCRYPTED_APP_ID,
                    pushType: PUSH_TYPE_DEFAULT,
                    transport: PUSH_TRANSPORT_FIREBASE,
                },
                {
                    token: regularToken,
                    appId: APP_RESIDENT_ID_ANDROID,
                    pushType: PUSH_TYPE_DEFAULT,
                    transport: PUSH_TRANSPORT_FIREBASE,
                },
            ])

            // Reload push transport to apply the mocks
            jest.resetModules()
            const { send } = require('@condo/domains/notification/transports/push')

            // Call send function
            const [isOk] = await send(testGenericSendPushArguments)

            // Verify the results
            expect(isOk).toBe(true)
            expect(mockFirebaseAdapter.sendNotification).toHaveBeenCalled()

            const callArgs = mockFirebaseAdapter.sendNotification.mock.calls[0][0]
            const { dataByToken } = callArgs

            expect(Object.keys(dataByToken)).toHaveLength(2)
            // Check encrypted app data
            expect(dataByToken[encryptedToken][ENCRYPTED_APP_ID]).toBeDefined()
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
            expect(dataByToken[encryptedToken][ENCRYPTED_APP_ID]).toMatch(new RegExp(`^${TEST_ENCRYPTION_VERSIONS[ENCRYPTED_APP_ID]}_`)) // NOSONAR

            // Check regular app data - should not be encrypted
            expect(dataByToken[regularToken][ENCRYPTED_APP_ID]).toBeUndefined()
            expect(dataByToken[regularToken]).toEqual(expect.objectContaining(testGenericSendPushArguments.data))

            expect(dataByToken[invalidEncryptionToken]).toBeUndefined()
        })
    })

    describe('push notification app groups', () => {
        it('should send notifications only to tokens for first appId in group when there are tokens in multiple appIds in group', async () => {
            const residentUser = await makeClientWithResidentUser()

            // Create tokens for different appIds in the same group
            const payload1 = getRandomTokenData({
                devicePlatform: DEVICE_PLATFORM_ANDROID,
                pushTransport: PUSH_TRANSPORT_FIREBASE,
                appId: 'appId_1',
                pushToken: getRandomFakeSuccessToken(),
            })
            const payload2 = {
                ...payload1,
                appId: 'appId_2',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(),
            }
            const payload3 = {
                ...payload1,
                appId: 'appId_3',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(),
            }

            await syncRemoteClientByTestClient(residentUser, payload1)
            await syncRemoteClientByTestClient(residentUser, payload2)
            await syncRemoteClientByTestClient(residentUser, payload3)

            const target = residentUser.user.id
            const batch = {
                id: faker.datatype.uuid(),
                title: faker.random.alphaNumeric(20),
                message: faker.random.alphaNumeric(50),
                deepLink: faker.random.alphaNumeric(30),
                messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
            }
            const today = dayjs().format(DATE_FORMAT_Z)
            const messageData = prepareMessageData(target, batch, today)

            expect(messageData).not.toEqual(0)

            const [messageStatus] = await sendMessageByTestClient(admin, messageData)

            expect(messageStatus.isDuplicateMessage).toBeFalsy()

            const messageWhere = {
                type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                uniqKey: messageData.uniqKey,
            }

            let message, transportMeta

            await waitFor(async () => {
                message = await Message.getOne(admin, messageWhere)

                transportMeta = message.processingMeta.transportsMeta[0]
                expect(message).toBeDefined()
                expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
            })

            transportMeta = message.processingMeta.transportsMeta[0]

            const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

            // Expect that only message with appId_1 is sent, since it's the first in the group and successful
            expect(responses).toHaveLength(1)
            expect(responses[0].groupName).toEqual('group_1')
            expect(responses[0].appId).toEqual('appId_1')
            expect(responses[0].success).toBeTruthy()
            expect(successCount).toEqual(1)
            expect(failureCount).toEqual(0)
            expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)
        })

        it('multiple transports and platforms can be in same group', async () => {
            const residentUser = await makeClientWithResidentUser()

            // Create tokens for different appIds in the same group
            const payloadsForAppId1 = []
            for (const devicePlatform of DEVICE_PLATFORM_TYPES) {
                for (const pushTransport of PUSH_TRANSPORT_TYPES.filter(transport => transport !== PUSH_TRANSPORT_WEBHOOK)) {
                    payloadsForAppId1.push(getRandomTokenData({
                        devicePlatform: devicePlatform,
                        pushTransport: pushTransport,
                        appId: 'appId_1',
                        pushToken: getRandomFakeSuccessToken(),
                        deviceId: faker.datatype.uuid(),
                    }))
                }
            }

            const payload2 = getRandomTokenData({
                devicePlatform: DEVICE_PLATFORM_ANDROID,
                pushTransport: PUSH_TRANSPORT_FIREBASE,
                appId: 'appId_2',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(),
            })
            const payload3 = getRandomTokenData({
                devicePlatform: DEVICE_PLATFORM_ANDROID,
                pushTransport: PUSH_TRANSPORT_FIREBASE,
                appId: 'appId_3',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(),
            })

            await Promise.allSettled([...payloadsForAppId1, payload2, payload3].map(async (payload) => {
                await syncRemoteClientByTestClient(residentUser, payload)
            }))

            const target = residentUser.user.id
            const batch = {
                id: faker.datatype.uuid(),
                title: faker.random.alphaNumeric(20),
                message: faker.random.alphaNumeric(50),
                deepLink: faker.random.alphaNumeric(30),
                messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
            }
            const today = dayjs().format(DATE_FORMAT_Z)
            const messageData = prepareMessageData(target, batch, today)

            expect(messageData).not.toEqual(0)

            const [messageStatus] = await sendMessageByTestClient(admin, messageData)

            expect(messageStatus.isDuplicateMessage).toBeFalsy()

            const messageWhere = {
                type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                uniqKey: messageData.uniqKey,
            }

            let message, transportMeta

            await waitFor(async () => {
                message = await Message.getOne(admin, messageWhere)

                transportMeta = message.processingMeta.transportsMeta[0]
                expect(message).toBeDefined()
                expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
            })

            transportMeta = message.processingMeta.transportsMeta[0]

            const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata
            // Expect that only message with appId_1 is sent, since it's the first in the group and successful
            expect(responses).toHaveLength(payloadsForAppId1.length)
            const uniqueGroupNames = [...new Set(responses.map(r => r.groupName))]
            expect(uniqueGroupNames).toHaveLength(1)
            expect(responses[0].groupName).toEqual('group_1')
            const uniqueAppIds = [...new Set(responses.map(r => r.appId))]
            expect(uniqueAppIds).toHaveLength(1)
            expect(responses[0].appId).toEqual('appId_1')
            expect(successCount).toEqual(payloadsForAppId1.length)
            expect(failureCount).toEqual(0)
            expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)
        })

        it('should send notifications to next app in group when first app in group fails', async () => {
            const residentUser = await makeClientWithResidentUser()

            // Create tokens for different appIds in the same group, but first will return error
            const payload1 = getRandomTokenData({
                devicePlatform: DEVICE_PLATFORM_ANDROID,
                pushTransport: PUSH_TRANSPORT_FIREBASE,
                appId: 'appId_1',
                pushToken: getRandomFakeFailToken(), // This token will return error
            })
            const payload2 = {
                ...payload1,
                appId: 'appId_2',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(),
            }
            const payload3 = {
                ...payload1,
                appId: 'appId_3',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(),
            }

            await syncRemoteClientByTestClient(residentUser, payload1)
            await syncRemoteClientByTestClient(residentUser, payload2)
            await syncRemoteClientByTestClient(residentUser, payload3)

            const target = residentUser.user.id
            const batch = {
                id: faker.datatype.uuid(),
                title: faker.random.alphaNumeric(20),
                message: faker.random.alphaNumeric(50),
                deepLink: faker.random.alphaNumeric(30),
                messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
            }
            const today = dayjs().format(DATE_FORMAT_Z)
            const messageData = prepareMessageData(target, batch, today)

            expect(messageData).not.toEqual(0)

            const [messageStatus] = await sendMessageByTestClient(admin, messageData)

            expect(messageStatus.isDuplicateMessage).toBeFalsy()

            const messageWhere = {
                type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                uniqKey: messageData.uniqKey,
            }

            let message, transportMeta

            await waitFor(async () => {
                message = await Message.getOne(admin, messageWhere)

                transportMeta = message.processingMeta.transportsMeta[0]
                expect(message).toBeDefined()
                expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
            })

            transportMeta = message.processingMeta.transportsMeta[0]

            const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

            // Expect that message is sent to appId_2, since appId_1 returned error
            expect(responses).toHaveLength(2)
            expect(responses[0].groupName).toEqual('group_1')
            expect(responses[0].appId).toEqual('appId_1')
            expect(responses[0].success).toBeFalsy()
            expect(responses[1].groupName).toEqual('group_1')
            expect(responses[1].appId).toEqual('appId_2')
            expect(responses[1].success).toBeTruthy()
            expect(successCount).toEqual(1)
            expect(failureCount).toEqual(1)
            expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)
        })

        it('should handle tokens both in group and without group', async () => {
            const residentUser = await makeClientWithResidentUser()

            // Create tokens - some in group, some outside group
            const payload1 = getRandomTokenData({
                devicePlatform: DEVICE_PLATFORM_ANDROID,
                pushTransport: PUSH_TRANSPORT_FIREBASE,
                appId: 'appId_1',
                pushToken: getRandomFakeSuccessToken(),
            })
            const payload2 = {
                ...payload1,
                appId: 'appId_2',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(),
            }
            // Token with appId that does not belong to any group
            const payload3 = {
                ...payload1,
                appId: 'appId_7', // appId does not belong to PUSH_NOTIFICATION_APP_GROUPS_SETTINGS
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(),
            }

            await syncRemoteClientByTestClient(residentUser, payload1)
            await syncRemoteClientByTestClient(residentUser, payload2)
            await syncRemoteClientByTestClient(residentUser, payload3)

            const target = residentUser.user.id
            const batch = {
                id: faker.datatype.uuid(),
                title: faker.random.alphaNumeric(20),
                message: faker.random.alphaNumeric(50),
                deepLink: faker.random.alphaNumeric(30),
                messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
            }
            const today = dayjs().format(DATE_FORMAT_Z)
            const messageData = prepareMessageData(target, batch, today)

            expect(messageData).not.toEqual(0)

            const [messageStatus] = await sendMessageByTestClient(admin, messageData)

            expect(messageStatus.isDuplicateMessage).toBeFalsy()

            const messageWhere = {
                type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                uniqKey: messageData.uniqKey,
            }

            let message, transportMeta

            await waitFor(async () => {
                message = await Message.getOne(admin, messageWhere)

                transportMeta = message.processingMeta.transportsMeta[0]
                expect(message).toBeDefined()
                expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
            })

            transportMeta = message.processingMeta.transportsMeta[0]

            const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

            // Expect that message is sent both in group (appId_1) and outside group (appId_7)
            expect(responses).toHaveLength(2)

            // Check that one group is 'group_1', another is 'appId_7'
            const groupedResponse = responses.find(r => r.groupName === 'group_1')
            const ungroupedResponse = responses.find(r => r.groupName === REMOTE_CLIENT_GROUP_UNGROUPED)

            expect(groupedResponse).toBeDefined()
            expect(ungroupedResponse).toBeDefined()

            expect(groupedResponse.appId).toEqual('appId_1')
            expect(ungroupedResponse.appId).toEqual('appId_7')
            expect(groupedResponse.success).toBeTruthy()
            expect(ungroupedResponse.success).toBeTruthy()

            expect(successCount).toEqual(2)
            expect(failureCount).toEqual(0)
            expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)
        })

        it('should continue to next app in group when previous apps in group fail', async () => {
            const residentUser = await makeClientWithResidentUser()

            // Create tokens for appIds in group, where first ones return error
            const payload1 = getRandomTokenData({
                devicePlatform: DEVICE_PLATFORM_ANDROID,
                pushTransport: PUSH_TRANSPORT_FIREBASE,
                appId: 'appId_1',
                pushToken: getRandomFakeFailToken(), // First token returns error
            })
            const payload2 = {
                ...payload1,
                appId: 'appId_2',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeFailToken(), // Second token also returns error
            }
            const payload3 = {
                ...payload1,
                appId: 'appId_3',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(), // Only third is successful
            }

            await syncRemoteClientByTestClient(residentUser, payload1)
            await syncRemoteClientByTestClient(residentUser, payload2)
            await syncRemoteClientByTestClient(residentUser, payload3)

            const target = residentUser.user.id
            const batch = {
                id: faker.datatype.uuid(),
                title: faker.random.alphaNumeric(20),
                message: faker.random.alphaNumeric(50),
                deepLink: faker.random.alphaNumeric(30),
                messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
            }
            const today = dayjs().format(DATE_FORMAT_Z)
            const messageData = prepareMessageData(target, batch, today)

            expect(messageData).not.toEqual(0)

            const [messageStatus] = await sendMessageByTestClient(admin, messageData)

            expect(messageStatus.isDuplicateMessage).toBeFalsy()

            const messageWhere = {
                type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                uniqKey: messageData.uniqKey,
            }

            let message, transportMeta

            await waitFor(async () => {
                message = await Message.getOne(admin, messageWhere)

                transportMeta = message.processingMeta.transportsMeta[0]
                expect(message).toBeDefined()
                expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
            })

            transportMeta = message.processingMeta.transportsMeta[0]

            const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

            // Expect attempts to send to all tokens, but success only with appId_3
            expect(responses).toHaveLength(3)

            expect(responses[0].groupName).toEqual('group_1')
            expect(responses[0].appId).toEqual('appId_1')
            expect(responses[0].success).toBeFalsy()

            expect(responses[1].groupName).toEqual('group_1')
            expect(responses[1].appId).toEqual('appId_2')
            expect(responses[1].success).toBeFalsy()

            expect(responses[2].groupName).toEqual('group_1')
            expect(responses[2].appId).toEqual('appId_3')
            expect(responses[2].success).toBeTruthy()

            expect(successCount).toEqual(1)
            expect(failureCount).toEqual(2)
            expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)
        })

        it('should handle multiple tokens in same app group and stop at first successful token', async () => {
            const residentUser = await makeClientWithResidentUser()

            // Create multiple tokens with the same app group, but some return error
            const payload1 = getRandomTokenData({
                devicePlatform: DEVICE_PLATFORM_ANDROID,
                pushTransport: PUSH_TRANSPORT_FIREBASE,
                appId: 'appId_1',
                pushToken: getRandomFakeFailToken(), // Unsuccessful token
            })
            const payload2 = {
                ...payload1,
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(), // Successful token
            }
            const payload3 = {
                ...payload1,
                appId: 'appId_2',
                deviceId: faker.datatype.uuid(),
                pushToken: getRandomFakeSuccessToken(), // Next app in group - should not be used since appId_1 had a success
            }

            await syncRemoteClientByTestClient(residentUser, payload1)
            await syncRemoteClientByTestClient(residentUser, payload2)
            await syncRemoteClientByTestClient(residentUser, payload3)

            const target = residentUser.user.id
            const batch = {
                id: faker.datatype.uuid(),
                title: faker.random.alphaNumeric(20),
                message: faker.random.alphaNumeric(50),
                deepLink: faker.random.alphaNumeric(30),
                messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
            }
            const today = dayjs().format(DATE_FORMAT_Z)
            const messageData = prepareMessageData(target, batch, today)

            expect(messageData).not.toEqual(0)

            const [messageStatus] = await sendMessageByTestClient(admin, messageData)

            expect(messageStatus.isDuplicateMessage).toBeFalsy()

            const messageWhere = {
                type: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
                uniqKey: messageData.uniqKey,
            }

            let message, transportMeta

            await waitFor(async () => {
                message = await Message.getOne(admin, messageWhere)

                transportMeta = message.processingMeta.transportsMeta[0]
                expect(message).toBeDefined()
                expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
            })

            transportMeta = message.processingMeta.transportsMeta[0]

            const { responses, pushContext, successCount, failureCount } = transportMeta.deliveryMetadata

            // Expect that only tokens from appId_1 are processed since at least one was successful
            // Should not proceed to appId_2 because there was a success in appId_1
            expect(responses).toHaveLength(2) // One failure and one success from appId_1

            // Check that all responses are from appId_1 (since we stopped at first success)
            const appId1Responses = responses.filter(r => r.appId === 'appId_1')
            const appId2Responses = responses.filter(r => r.appId === 'appId_2')

            expect(appId1Responses).toHaveLength(2)
            expect(appId2Responses).toHaveLength(0) // Should be 0 because we stopped after finding success in appId_1

            const appId1Success = appId1Responses.filter(r => r.success)
            const appId1Failure = appId1Responses.filter(r => !r.success)

            expect(appId1Success).toHaveLength(1)
            expect(appId1Failure).toHaveLength(1)

            expect(successCount).toEqual(1)
            expect(failureCount).toEqual(1)
            expect(pushContext[PUSH_TYPE_DEFAULT]).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification).toBeDefined()
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.body).toEqual(batch.message)
            expect(pushContext[PUSH_TYPE_DEFAULT].notification.title).toEqual(batch.title)
        })
    })

    describe('expired pushToken cleanup', () => {
        const testMessageType = BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE
        let residentUser
        let payload

        beforeAll(async () => {
            residentUser = await makeClientWithResidentUser()
            payload = getRandomTokenData({
                devicePlatform: DEVICE_PLATFORM_ANDROID,
                appId: 'test-tokens-invalidation-app',
                pushToken: null,
                pushTokenVoIP: null,
            })
        })

        function getAdapterMock (adapterType, error) {
            const staticProperties = { 
                ...adapterType,
            }
            Object.getOwnPropertyNames(adapterType)
                .filter(k => typeof adapterType[k] === 'function' )
                .forEach(k => staticProperties[k] = adapterType[k])
            return {
                constructor: staticProperties,
                sendNotification: jest.fn(({ tokens }) => {
                    return [false, {
                        responses: tokens.map(token => ({
                            pushToken: token,
                            success: false,
                            ...(typeof error === 'function') ? error(token) : error,
                        })),
                        failureCount: tokens.length,
                        successCount: 0,
                    }]
                }),
            }
        }

        function getAdapterFileName ({ adapterType, adapterFileName }) {
            return adapterFileName || (adapterType.name[0].toLowerCase() + adapterType.name.slice(1))
        }

        function mockAdapter ({ adapterType, adapterFileName, error }) {
            const mock = getAdapterMock(adapterType, error)
            const fileName = getAdapterFileName({ adapterType, adapterFileName })
            jest.doMock(`@condo/domains/notification/adapters/${fileName}`, () => ({
                [adapterType.name]: jest.fn(() => mock),
            }))
            jest.doMock('@open-condo/keystone/schema', () => {
                return {
                    find: async (schemaName, where) => getSchemaCtx(schemaName).list.adapter.find(where),
                    getSchemaCtx: (schemaName) => getSchemaCtx(schemaName),
                }
            })
        }

        const TEST_CASES = [
            { 
                adapter: FirebaseAdapter,
                pushTransportType: PUSH_TRANSPORT_FIREBASE,
                expectedErrors: [
                    { error: { code: 'messaging/registration-token-not-registered' } },
                ],
            },
            { 
                adapter: AppleAdapter,
                pushTransportType: PUSH_TRANSPORT_APPLE,
                expectedErrors: [
                    { error: { reason: 'Unregistered' } },
                    { error: { reason: 'ExpiredToken' } },
                ],
            },
            { 
                adapter: HCMAdapter,
                adapterFileName: 'hcmAdapter',
                pushTransportType: PUSH_TRANSPORT_HUAWEI,
                expectedErrors: [
                    { code: ALL_TOKENS_ARE_INVALID_CODE },
                    (token) => (
                        { code: PUSH_PARTIAL_SUCCESS_CODE, msg: JSON.stringify({ illegal_tokens: [token] }) }
                    ),
                ],
            },
            { 
                adapter: RedStoreAdapter,
                pushTransportType: PUSH_TRANSPORT_REDSTORE,
                expectedErrors: [
                    { error: { status: 'NOT_FOUND', code: 404 } },
                ],
            },
            { 
                adapter: OneSignalAdapter,
                pushTransportType: PUSH_TRANSPORT_ONESIGNAL,
                expectedErrors: [
                    { response: { errors: ['All included players are not subscribed'] } },
                    (token) => ({ response: { errors: { invalid_player_ids: [token] } } }),
                ],
            },
        ]

        afterAll(() => {
            jest.unmock('@open-condo/keystone/schema')
            for (const { adapter, adapterFileName } of TEST_CASES) {
                const fileName = getAdapterFileName({ adapterType: adapter, adapterFileName })
                jest.unmock(`@condo/domains/notification/adapters/${fileName}`)
            }
        })
        
        describe.each(TEST_CASES)('$adapter.name', ({ adapter, adapterFileName, pushTransportType, expectedErrors }) => {

            test.each(expectedErrors)('%#', async (expectedError) => {
                const fakeFailToken = getRandomFakeFailToken()
                const [remoteClient] = await syncRemoteClientByTestClient(residentUser, {
                    ...payload,
                    pushTokens: [
                        { token: fakeFailToken, transport: pushTransportType, isPush: true, isVoIP: false },
                    ],
                })
                const remoteClientPushToken = await RemoteClientPushToken.getOne(admin, { remoteClient: { id: remoteClient.id } })

                jest.resetModules()
                mockAdapter({ adapterType: adapter, adapterFileName, error: expectedError })
                const pushTransport = requirePushTransportIsolated()

                const [isOk] = await pushTransport.send({
                    notification: { title: 'Test', body: 'Test' },
                    data: { notificationId: faker.datatype.uuid(), type: testMessageType, messageCreatedAt: new Date().toISOString() },
                    message: { id: faker.datatype.uuid(), type: testMessageType, lang: conf.DEFAULT_LOCALE, meta: { dv: 1, data: {} } },
                    remoteClient: { id: remoteClient.id },
                })
                expect(isOk).toEqual(false)

                const updatedRemoteClient = await RemoteClient.getOne(admin, { id: remoteClient.id })
                expect(updatedRemoteClient.pushToken).toBeNull()
                expect(updatedRemoteClient.pushTransport).toBeNull()

                const [pushToken] = await RemoteClientPushToken.getAll(admin, { id: remoteClientPushToken.id, deletedAt_not: null })
                expect(pushToken).toBeDefined()
                expect(pushToken.deletedAt).not.toBeNull()
            })

        })

    })
})

