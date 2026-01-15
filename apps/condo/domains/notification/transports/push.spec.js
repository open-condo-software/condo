/**
 * @jest-environment node
 */
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
    PUSH_TRANSPORT,
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
})


