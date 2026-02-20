/**
 * @jest-environment node
 */
jest.mock('@open-condo/config', () => {
    const original = jest.requireActual('@open-condo/config')
    const mockedValues = {
        TESTS_FAKE_WORKER_MODE: true,
        PUSH_NOTIFICATION_APP_GROUPS: JSON.stringify({
            group_1: ['appId_1', 'appId_2', 'appId_3'],
            group_2: ['appId_4', 'appId_5'],
            group_3: ['appId_6'],
        }),
    }
    return new Proxy(original, {
        get (target, key) {
            if (key in mockedValues) {
                return mockedValues[key]
            }
            return original[key]
        },
        set: jest.fn(),
    })
})
const PUSH_NOTIFICATION_APP_GROUPS_SETTINGS = {
    group_1: ['appId_1', 'appId_2', 'appId_3'],
    group_2: ['appId_4', 'appId_5'],
    group_3: ['appId_6'],
}
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')

const { DATE_FORMAT_Z } = require('@condo/domains/common/utils/date')
const { PUSH_SUCCESS_CODE, PUSH_PARTIAL_SUCCESS_CODE } = require('@condo/domains/notification/adapters/hcm/constants')
const {
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
    PUSH_TRANSPORT, DEVICE_PLATFORM_TYPES, PUSH_TRANSPORT_TYPES, PUSH_TRANSPORT_WEBHOOK,
} = require('@condo/domains/notification/constants/constants')
const { prepareMessageData } = require('@condo/domains/notification/tasks/sendMessageBatch.helpers')
const { Message, sendMessageByTestClient, syncRemoteClientByTestClient } = require('@condo/domains/notification/utils/testSchema')
const { getRandomTokenData, getRandomFakeSuccessToken, getRandomFakeFailToken } = require('@condo/domains/notification/utils/testSchema/utils')
const { makeClientWithResidentUser, makeClientWithStaffUser } = require('@condo/domains/user/utils/testSchema')


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
            const uniqueAppIds = [...new Set(responses.map(r => r.groupName))]
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
                pushTransport: PUSH_TRANSPORT_HUAWEI,
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
            
            // Check that one group is 'group_1', another is 'ungrouped_appId_7'
            const groupedResponse = responses.find(r => r.groupName === 'group_1')
            const ungroupedResponse = responses.find(r => r.groupName === 'ungrouped_appId_7')
            
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
})


