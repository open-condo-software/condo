/**
 * @jest-environment node
 */
jest.mock('@open-condo/config', () => {
    const actual = jest.requireActual('@open-condo/config')
    return new Proxy(actual, {
        set () {},
        get (_, p) {
            if (p === 'PUSH_ADAPTER_SETTINGS') {
                return JSON.stringify({
                    encryption: {
                        'test-encrypted-app-with-invalid-version': 'non-existent-encryption-version',
                        'test-encrypted-app': 'v1',
                    },
                })
            }
            if (p === 'PUSH_MESSAGE_OVERRIDES') {
                return global.__pushMessageOverrides || actual[p]
            }
            //if (p === '')
            return actual[p]
        },
    })
})
const ENCRYPTED_APP_ID = 'test-encrypted-app'
const ALWAYS_INVALID_ENCRYPTION_APP_ID = 'test-encrypted-app-with-invalid-version'
const TEST_ENCRYPTION_VERSIONS = {
    [ENCRYPTED_APP_ID]: 'v1',
}

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')

const { DATE_FORMAT_Z } = require('@condo/domains/common/utils/date')
const { FirebaseAdapter } = require('@condo/domains/notification/adapters/firebaseAdapter')
const { PUSH_SUCCESS_CODE, PUSH_PARTIAL_SUCCESS_CODE } = require('@condo/domains/notification/adapters/hcm/constants')
const {
    BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE,
    CUSTOM_CONTENT_MESSAGE_TYPE,
    CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
    DEVICE_PLATFORM_ANDROID,
    PUSH_TRANSPORT_FIREBASE,
    PUSH_TRANSPORT_HUAWEI,
    PUSH_TYPE_DEFAULT,
    PUSH_TYPE_SILENT_DATA,
    HUAWEI_APP_TYPE_BY_APP_ID,
    APP_RESIDENT_ID_ANDROID,
    APP_MASTER_ID_ANDROID,
    MESSAGE_SENT_STATUS,
    MESSAGE_ERROR_STATUS,
    PUSH_TRANSPORT,
} = require('@condo/domains/notification/constants/constants')
const { prepareMessageData } = require('@condo/domains/notification/tasks/sendMessageBatch.helpers')
const { Message, sendMessageByTestClient, syncRemoteClientByTestClient } = require('@condo/domains/notification/utils/testSchema')
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

function mockFirebaseAdapterModule (mockFirebaseAdapter) {
    jest.doMock('@condo/domains/notification/adapters/firebaseAdapter', () => ({
        FirebaseAdapter: jest.fn(() => mockFirebaseAdapter),
    }))
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

        test('does not send push for tokens whose appId has overrides but missing translation for message.type', async () => {
            mockGetTokens.mockResolvedValue({
                tokensByTransport: {
                    [PUSH_TRANSPORT_FIREBASE]: [tokenEmptyReplacers],
                },
                pushTypes: {
                    [tokenEmptyReplacers]: PUSH_TYPE_DEFAULT,
                },
                appIds: {
                    [tokenEmptyReplacers]: APP_ID_EMPTY_OVERRIDES,
                },
                metaByToken: {},
                count: 1,
            })

            const pushTransport = requirePushTransportIsolated()

            const [isOk, result] = await pushTransport.send({
                baseData: { notificationId: faker.datatype.uuid(), type: testMessageType, messageCreatedAt: new Date().toISOString() },
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
            mockGetTokens.mockResolvedValue({
                tokensByTransport: {
                    [PUSH_TRANSPORT_FIREBASE]: [tokenNoReplacers, tokenEmptyReplacers, tokenReplacersOk],
                },
                pushTypes: {
                    [tokenNoReplacers]: PUSH_TYPE_DEFAULT,
                    [tokenEmptyReplacers]: PUSH_TYPE_DEFAULT,
                    [tokenReplacersOk]: PUSH_TYPE_DEFAULT,
                },
                appIds: {
                    [tokenNoReplacers]: APP_ID_WITH_NO_OVERRIDES,
                    [tokenEmptyReplacers]: APP_ID_EMPTY_OVERRIDES,
                    [tokenReplacersOk]: APP_ID_WITH_OVERRIDES_OK,
                },
                metaByToken: {},
                count: 3,
            })

            const pushTransport = requirePushTransportIsolated()

            const [isOk, result] = await pushTransport.send({
                baseData: { notificationId: faker.datatype.uuid(), type: testMessageType, messageCreatedAt: new Date().toISOString(), hello: 'world' },
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
            baseNotification: { title: faker.random.alphaNumeric(10), body: faker.random.alphaNumeric(10) },
            baseData: { notificationId: testMessageId, message: faker.random.alphaNumeric(10), title: faker.random.alphaNumeric(10), type: CUSTOM_CONTENT_MESSAGE_TYPE },
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

        it('should encrypt data when sending to encrypted app', async () => {
            const token = getRandomFakeSuccessToken()
            // Mock the getTokens function
            mockGetTokens.mockResolvedValue({
                tokensByTransport: {
                    [PUSH_TRANSPORT_FIREBASE]: [token],
                },
                pushTypes: { [token]: PUSH_TYPE_DEFAULT },
                appIds: { [token]: ENCRYPTED_APP_ID },
                metaByToken: { [token]: {} },
                count: 1,
            })
    
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
            mockGetTokens.mockResolvedValue({
                tokensByTransport: {
                    [PUSH_TRANSPORT_FIREBASE]: [encryptedToken, regularToken],
                },
                pushTypes: {
                    [encryptedToken]: PUSH_TYPE_DEFAULT,
                    [regularToken]: PUSH_TYPE_DEFAULT,
                },
                appIds: {
                    [encryptedToken]: ENCRYPTED_APP_ID,
                    [regularToken]: APP_RESIDENT_ID_ANDROID,
                },
                metaByToken: {
                    [encryptedToken]: {},
                    [regularToken]: {},
                },
                count: 2,
            })

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
            // Check encrypted app data
            expect(dataByToken[encryptedToken][ENCRYPTED_APP_ID]).toBeDefined()
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
            expect(dataByToken[encryptedToken][ENCRYPTED_APP_ID]).toMatch(new RegExp(`^${TEST_ENCRYPTION_VERSIONS[ENCRYPTED_APP_ID]}_`)) // NOSONAR

            // Check regular app data - should not be encrypted
            expect(dataByToken[regularToken][ENCRYPTED_APP_ID]).toBeUndefined()
            expect(dataByToken[regularToken]).toEqual(expect.objectContaining(testGenericSendPushArguments.baseData))
        })
    
        it('should not send push to app if encryption fails', async () => {
            const invalidEncryptionToken = getRandomFakeSuccessToken()
            // Mock the getTokens function
            mockGetTokens.mockResolvedValue({
                tokensByTransport: {
                    [PUSH_TRANSPORT_FIREBASE]: [invalidEncryptionToken],
                },
                pushTypes: { [invalidEncryptionToken]: PUSH_TYPE_DEFAULT },
                appIds: { [invalidEncryptionToken]: ALWAYS_INVALID_ENCRYPTION_APP_ID },
                metaByToken: { [invalidEncryptionToken]: {} },
                count: 1,
            })

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
            mockGetTokens.mockResolvedValue({
                tokensByTransport: {
                    [PUSH_TRANSPORT_FIREBASE]: [invalidEncryptionToken, encryptedToken, regularToken],
                },
                pushTypes: { 
                    [invalidEncryptionToken]: PUSH_TYPE_DEFAULT,
                    [encryptedToken]: PUSH_TYPE_DEFAULT,
                    [regularToken]: PUSH_TYPE_DEFAULT,
                },
                appIds: { 
                    [invalidEncryptionToken]: ALWAYS_INVALID_ENCRYPTION_APP_ID,
                    [encryptedToken]: ENCRYPTED_APP_ID,
                    [regularToken]: APP_RESIDENT_ID_ANDROID,
                },
                metaByToken: { 
                    [invalidEncryptionToken]: {},
                    [encryptedToken]: {},
                    [regularToken]: {},
                },
                count: 3,
            })

            // Reload push transport to apply the mocks
            jest.resetModules()
            const { send } = require('@condo/domains/notification/transports/push')

            // Call send function
            const [isOk, res] = await send(testGenericSendPushArguments)

            console.error(JSON.stringify(res, null, 2))

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
            expect(dataByToken[regularToken]).toEqual(expect.objectContaining(testGenericSendPushArguments.baseData))

            expect(dataByToken[invalidEncryptionToken]).toBeUndefined()
        })
    })
})


