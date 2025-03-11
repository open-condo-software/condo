const { faker } = require('@faker-js/faker')
const { get } = require('lodash')

const { makeLoggedInAdminClient, UUID_RE, DATETIME_RE, waitFor } = require('@open-condo/keystone/test.utils')
const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const {
    MESSAGE_SENDING_STATUS,
    MESSAGE_RESENDING_STATUS,
    MESSAGE_SENT_STATUS,
    EMAIL_TRANSPORT,
    PUSH_TRANSPORT,
    SMS_TRANSPORT,
    VOIP_INCOMING_CALL_MESSAGE_TYPE,
    CANCELED_CALL_MESSAGE_PUSH_TYPE,
    B2C_APP_MESSAGE_PUSH_TYPE,
    DEVICE_PLATFORM_ANDROID,
    APP_RESIDENT_ID_ANDROID,
    APP_RESIDENT_ID_IOS,
    DEVICE_PLATFORM_IOS,
    PUSH_TRANSPORT_FIREBASE,
    PUSH_TRANSPORT_HUAWEI,
    PUSH_TRANSPORT_APPLE,
    PUSH_TYPE_DEFAULT,
    PUSH_TYPE_SILENT_DATA,
    REGISTER_NEW_USER_MESSAGE_TYPE,
    MESSAGE_DISABLED_BY_USER_STATUS,
    MESSAGE_DELIVERY_OPTIONS,
} = require('@condo/domains/notification/constants/constants')
const {
    syncRemoteClientWithPushTokenByTestClient, sendMessageByTestClient,
    resendMessageByTestClient,
    Message,
    createTestMessage,
    createTestNotificationUserSetting,
} = require('@condo/domains/notification/utils/testSchema')
const { getRandomFakeSuccessToken } = require('@condo/domains/notification/utils/testSchema/utils')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

describe('SendMessageService', () => {
    let admin

    beforeAll( async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('sendMessage', () => {
        describe('called by Admin', () => {
            it('returns sending status', async () => {
                const [data] = await sendMessageByTestClient(admin)
                expect(data.id).toMatch(UUID_RE)
                expect(data.status).toEqual(MESSAGE_SENDING_STATUS)
            })

            it('returns uniqKey value', async () => {
                const uniqKey = faker.datatype.uuid()

                const [data] = await sendMessageByTestClient(admin, { uniqKey })
                const message = await Message.getOne(admin, { id: data.id })

                expect(message.id).toMatch(UUID_RE)
                expect(message.uniqKey).toEqual(uniqKey)
            })

            it('creates Message sets "sent" status on successful delivery', async () => {
                const [data, attrs] = await sendMessageByTestClient(admin)

                // give worker some time
                await waitFor(async () => {
                    const message = await Message.getOne(admin, { id: data.id })
                    const transportMeta = message.processingMeta.transportsMeta[0]

                    expect(message.lang).toEqual(attrs.lang)
                    expect(message.type).toEqual(attrs.type)
                    expect(message.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(message.sentAt).toMatch(DATETIME_RE)
                    expect(message.createdBy).toEqual(expect.objectContaining({ id: admin.user.id }))
                    expect(message.updatedBy).toEqual(null)
                    expect(message.organization).toEqual(null)
                    expect(message.user).toEqual(expect.objectContaining({ id: admin.user.id }))
                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(EMAIL_TRANSPORT)
                    expect(transportMeta.messageContext.to).toEqual(attrs.to.email)
                })
            })

            describe('VoIP messages', () => {
                it('correctly detects VoIP message type and sends notification to proper FireBase token', async () => {
                    const userClient = await makeClientWithResidentAccessAndProperty()
                    const payload = {
                        devicePlatform: DEVICE_PLATFORM_ANDROID,
                        appId: APP_RESIDENT_ID_ANDROID,
                        pushTransport: PUSH_TRANSPORT_FIREBASE,
                        pushTypeVoIP: PUSH_TYPE_SILENT_DATA,
                        pushTokenVoIP: getRandomFakeSuccessToken(),
                    }

                    await syncRemoteClientWithPushTokenByTestClient(userClient, payload)

                    const messageAttrs = {
                        to: { user: { id: userClient.user.id } },
                        type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                        meta: {
                            dv: 1,
                            body: faker.random.alphaNumeric(8),
                            title: faker.random.alphaNumeric(8),
                            data: {
                                B2CAppId: faker.datatype.uuid(),
                                callId: faker.datatype.uuid(),
                            },
                        },
                    }
                    const [data] = await sendMessageByTestClient(admin, messageAttrs)

                    let message

                    await waitFor(async () => {
                        message = await Message.getOne(admin, { id: data.id })

                        expect(message.status).toEqual(MESSAGE_SENT_STATUS)
                        expect(message.user.id).toEqual(userClient.user.id)
                    })

                    const transportMeta = message.processingMeta.transportsMeta[0]

                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                    expect(message.processingMeta.isVoIP).toBeTruthy()
                    expect(transportMeta.deliveryMetadata.pushContext[payload.pushTypeVoIP].token).toEqual(payload.pushTokenVoIP)
                    expect(transportMeta.deliveryMetadata.pushContext[payload.pushTypeVoIP].token).not.toEqual(payload.pushToken)
                })

                it('correctly detects VoIP message type and sends notification to proper Huawei token', async () => {
                    const userClient = await makeClientWithResidentAccessAndProperty()
                    const payload = {
                        devicePlatform: DEVICE_PLATFORM_ANDROID,
                        appId: APP_RESIDENT_ID_ANDROID,
                        pushTransport: PUSH_TRANSPORT_HUAWEI,
                        pushTokenVoIP: getRandomFakeSuccessToken(),
                    }

                    await syncRemoteClientWithPushTokenByTestClient(userClient, payload)

                    const messageAttrs = {
                        to: { user: { id: userClient.user.id } },
                        type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                        meta: {
                            dv: 1,
                            body: faker.random.alphaNumeric(8),
                            title: faker.random.alphaNumeric(8),
                            data: {
                                B2CAppId: faker.datatype.uuid(),
                                callId: faker.datatype.uuid(),
                            },
                        },
                    }
                    const [data] = await sendMessageByTestClient(admin, messageAttrs)

                    let message

                    await waitFor(async () => {
                        message = await Message.getOne(admin, { id: data.id })

                        expect(message.status).toEqual(MESSAGE_SENT_STATUS)
                        expect(message.user.id).toEqual(userClient.user.id)
                    })

                    const transportMeta = message.processingMeta.transportsMeta[0]

                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                    expect(message.processingMeta.isVoIP).toBeTruthy()
                    expect(transportMeta.deliveryMetadata.pushContext.default.token).toEqual(payload.pushTokenVoIP)
                    expect(transportMeta.deliveryMetadata.pushContext.default.token).not.toEqual(payload.pushToken)
                })

                it('correctly detects VoIP message type and sends notification to proper Apple token', async () => {
                    const userClient = await makeClientWithResidentAccessAndProperty()
                    const payload = {
                        devicePlatform: DEVICE_PLATFORM_IOS,
                        appId: APP_RESIDENT_ID_IOS,
                        pushTransport: PUSH_TRANSPORT_APPLE,
                        pushTokenVoIP: getRandomFakeSuccessToken(),
                    }

                    await syncRemoteClientWithPushTokenByTestClient(userClient, payload)

                    const messageAttrs = {
                        to: { user: { id: userClient.user.id } },
                        type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                        meta: {
                            dv: 1,
                            body: faker.random.alphaNumeric(8),
                            title: faker.random.alphaNumeric(8),
                            data: {
                                B2CAppId: faker.datatype.uuid(),
                                callId: faker.datatype.uuid(),
                            },
                        },
                    }
                    const [data] = await sendMessageByTestClient(admin, messageAttrs)

                    let message

                    await waitFor(async () => {
                        message = await Message.getOne(admin, { id: data.id })

                        expect(message.status).toEqual(MESSAGE_SENT_STATUS)
                        expect(message.user.id).toEqual(userClient.user.id)
                    })

                    const transportMeta = message.processingMeta.transportsMeta[0]

                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                    expect(message.processingMeta.isVoIP).toBeTruthy()
                    expect(transportMeta.deliveryMetadata.pushContext.default.token).toEqual(payload.pushTokenVoIP)
                    expect(transportMeta.deliveryMetadata.pushContext.default.token).not.toEqual(payload.pushToken)
                })

            })

            describe('Push message sent by preferred push type', () => {
                it('CANCELED_CALL_MESSAGE_PUSH_TYPE has a preferred push type - PUSH_TYPE_SILENT_DATA', async () => {
                    const userClient = await makeClientWithResidentAccessAndProperty()
                    const payload = {
                        pushType: PUSH_TYPE_DEFAULT,
                    }

                    await syncRemoteClientWithPushTokenByTestClient(userClient, payload)
                    const messageAttrs = {
                        to: { user: { id: userClient.user.id } },
                        type: CANCELED_CALL_MESSAGE_PUSH_TYPE,
                        meta: {
                            dv: 1,
                            body: faker.random.alphaNumeric(8),
                            title: faker.random.alphaNumeric(8),
                            data: {
                                B2CAppId: faker.datatype.uuid(),
                                callId: faker.datatype.uuid(),
                            },
                        },
                    }
                    const [data] = await sendMessageByTestClient(admin, messageAttrs)

                    let message

                    await waitFor(async () => {
                        message = await Message.getOne(admin, { id: data.id })

                        expect(message.status).toEqual(MESSAGE_SENT_STATUS)
                        expect(message.user.id).toEqual(userClient.user.id)
                    })

                    const transportMeta = message.processingMeta.transportsMeta[0]

                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                    expect(transportMeta.deliveryMetadata.pushContext[PUSH_TYPE_SILENT_DATA].data.type).toEqual(CANCELED_CALL_MESSAGE_PUSH_TYPE)
                })

                it('Any message type without a preferred push type is retrieved from the remote client', async () => {
                    const userClient = await makeClientWithResidentAccessAndProperty()
                    const payload = {
                        pushType: PUSH_TYPE_DEFAULT,
                    }

                    await syncRemoteClientWithPushTokenByTestClient(userClient, payload)
                    const messageAttrs = {
                        to: { user: { id: userClient.user.id } },
                        type: B2C_APP_MESSAGE_PUSH_TYPE, // Any other message type without a preferred push type can be here
                        meta: {
                            dv: 1,
                            body: faker.random.alphaNumeric(8),
                            title: faker.random.alphaNumeric(8),
                            data: {
                                B2CAppId: faker.datatype.uuid(),
                                callId: faker.datatype.uuid(),
                            },
                        },
                    }
                    const [data] = await sendMessageByTestClient(admin, messageAttrs)

                    let message

                    await waitFor(async () => {
                        message = await Message.getOne(admin, { id: data.id })

                        expect(message.status).toEqual(MESSAGE_SENT_STATUS)
                        expect(message.user.id).toEqual(userClient.user.id)
                    })

                    const transportMeta = message.processingMeta.transportsMeta[0]

                    expect(transportMeta.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportMeta.transport).toEqual(PUSH_TRANSPORT)
                    expect(transportMeta.deliveryMetadata.pushContext[payload.pushType].data.type).toEqual(B2C_APP_MESSAGE_PUSH_TYPE)
                })
            })


            describe('with INVITE_NEW_EMPLOYEE message type', () => {
                it('throws error when "inviteCode" is not specified in meta', async () => {
                    // TODO(pahaz): use expectToThrowGQLError check here
                    await catchErrorFrom(async () => {
                        await sendMessageByTestClient(admin, {
                            meta: {
                                dv: 1,
                            },
                        })
                    }, ({ errors, data }) => {
                        expect(errors).toMatchObject([{
                            message: 'Missing value for required "meta.inviteCode" attribute',
                            path: ['result'],
                            extensions: {
                                mutation: 'sendMessage',
                                variable: ['data', 'meta'],
                                code: 'BAD_USER_INPUT',
                                type: 'REQUIRED',
                                message: 'Missing value for required "meta.inviteCode" attribute',
                            },
                        }])
                        expect(data).toEqual({ 'result': null })
                    })
                })

                it('throws error when unregistered attribute is provided in "meta"', async () => {
                    // TODO(pahaz): use expectToThrowGQLError check here
                    await catchErrorFrom(async () => {
                        await sendMessageByTestClient(admin, {
                            meta: {
                                dv: 1,
                                inviteCode: faker.random.alphaNumeric(8),
                                unregisteredAttrName: faker.random.alphaNumeric(8),
                            },
                        })
                    }, ({ errors, data }) => {
                        expect(errors).toMatchObject([{
                            message: 'Unknown attribute "unregisteredAttrName" provided to "meta" variable',
                            path: ['result'],
                            extensions: {
                                mutation: 'sendMessage',
                                variable: ['data', 'meta'],
                                code: 'BAD_USER_INPUT',
                                type: 'UNKNOWN_ATTRIBUTE',
                                message: 'Unknown attribute "unregisteredAttrName" provided to "meta" variable',
                            },
                        }])
                        expect(data).toEqual({ 'result': null })
                    })
                })
            })

            it('throws error when "emailFrom" attribute is not provided', async () => {
                await catchErrorFrom(async () => {
                    await sendMessageByTestClient(admin, {
                        emailFrom: faker.internet.email(),
                        to: {
                            email: null,
                            user: {
                                id: admin.user.id,
                            },
                        },
                    })
                }, ({ errors, data }) => {
                    expect(errors).toMatchObject([{
                        message: 'You can not use emailFrom without to.email',
                        path: ['result'],
                        extensions: {
                            mutation: 'sendMessage',
                            variable: ['data', 'to', 'email'],
                            code: 'BAD_USER_INPUT',
                            type: 'REQUIRED',
                            message: 'You can not use emailFrom without to.email',
                        },
                    }])
                    expect(data).toEqual({ 'result': null })
                })
            })

            it('throws error when "email", "phone", "user" and "remoteClient" attributes are not provided', async () => {
                await catchErrorFrom(async () => {
                    await sendMessageByTestClient(admin, {
                        emailFrom: faker.internet.email(),
                        to: { },
                    })
                }, ({ errors, data }) => {
                    expect(errors).toMatchObject([{
                        message: 'You should provide either "user", "email", "phone" or "remoteClient" attribute',
                        path: ['result'],
                        extensions: {
                            mutation: 'sendMessage',
                            variable: ['data'],
                            code: 'BAD_USER_INPUT',
                            type: 'REQUIRED',
                            message: 'You should provide either "user", "email", "phone" or "remoteClient" attribute',
                        },
                    }])
                    expect(data).toEqual({ 'result': null })
                })
            })

            it('throws error when not supported value provided for "type" variable', async () => {
                await catchErrorFrom(async () => {
                    await sendMessageByTestClient(admin, {
                        emailFrom: faker.internet.email(),
                        type: 'unknownMessageType',
                    })
                }, ({ errors, data }) => {
                    expect(errors).toMatchObject([{
                        message: 'Variable "$data" got invalid value "unknownMessageType" at "data.type"; Value "unknownMessageType" does not exist in "MessageType" enum.',
                    }])
                    expect(data).toBeUndefined()
                })
            })

            it('throws error when not supported value of "meta.dv" attribute is provided', async () => {
                await catchErrorFrom(async () => {
                    await sendMessageByTestClient(admin, {
                        emailFrom: faker.internet.email(),
                        meta: { dv: 2, inviteCode: faker.random.alphaNumeric(8) },
                    })
                }, ({ errors, data }) => {
                    expect(errors).toMatchObject([{
                        message: 'Wrong value for data version number',
                        path: ['result'],
                        extensions: {
                            mutation: 'sendMessage',
                            variable: ['data', 'meta', 'dv'],
                            code: 'BAD_USER_INPUT',
                            type: 'DV_VERSION_MISMATCH',
                            message: 'Wrong value for data version number',
                        },
                    }])
                    expect(data).toEqual({ result: null })
                })
            })
        })
    })

    describe('resendMessage', () => {
        describe('called by Admin', () => {
            it('returns "resending" status', async () => {
                const [message] = await createTestMessage(admin, { status: MESSAGE_SENT_STATUS })
                const [data] = await resendMessageByTestClient(admin, message)
                expect(data.id).toMatch(UUID_RE)
                expect(data.status).toEqual(MESSAGE_RESENDING_STATUS)
            })
        })
    })

    test('Send message even if one of 2+ transports is disabled by user', async () => {
        const messageType = REGISTER_NEW_USER_MESSAGE_TYPE
        const transportToDisable = SMS_TRANSPORT
        const allTransports = get(MESSAGE_DELIVERY_OPTIONS, [messageType, 'allowedTransports'])

        // Need to test message type that have 2+ transports
        expect(allTransports.length).toBeGreaterThanOrEqual(2)
        expect(allTransports).toEqual(expect.arrayContaining([transportToDisable]))

        const disabledTransports = allTransports.filter(t => t === transportToDisable)
        const enabledTransports = allTransports.filter(t => t !== transportToDisable)

        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        await createTestNotificationUserSetting(client, {
            messageType,
            messageTransport: transportToDisable,
            isEnabled: false,
        })
        const [data] = await sendMessageByTestClient(admin, {
            to: { user: { id: client.user.id } },
            type: messageType,
            meta: { dv: 1 },
        })

        // give worker some time
        await waitFor(async () => {
            const message = await Message.getOne(admin, { id: data.id })

            expect(message.status).toBe(MESSAGE_SENT_STATUS)

            const transportsMeta = get(message, ['processingMeta', 'transportsMeta'])

            expect(transportsMeta).toBeTruthy()

            expect(transportsMeta).toEqual(expect.arrayContaining([
                ...disabledTransports.map((transport) => expect.objectContaining({
                    status: MESSAGE_DISABLED_BY_USER_STATUS,
                    transport,
                })),
                ...enabledTransports.map((transport) => expect.objectContaining({
                    status: MESSAGE_SENT_STATUS,
                    transport,
                })),
            ]))
        })
    })

    test('Not send message if message type is disabled by user', async () => {
        const messageType = REGISTER_NEW_USER_MESSAGE_TYPE
        const allTransports = get(MESSAGE_DELIVERY_OPTIONS, [messageType, 'allowedTransports'])

        // Need to test message type that have 2+ transports
        expect(allTransports.length).toBeGreaterThanOrEqual(2)

        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        await createTestNotificationUserSetting(client, {
            messageType,
            messageTransport: null,
            isEnabled: false,
        })
        const [data] = await sendMessageByTestClient(admin, {
            to: { user: { id: client.user.id } },
            type: messageType,
            meta: { dv: 1 },
        })

        // give worker some time
        await waitFor(async () => {
            const message = await Message.getOne(admin, { id: data.id })

            expect(message.status).toBe(MESSAGE_DISABLED_BY_USER_STATUS)

            const transportsMeta = get(message, ['processingMeta', 'transportsMeta'])

            expect(transportsMeta).toBeTruthy()

            expect(transportsMeta).toEqual(expect.arrayContaining(
                allTransports.map((transport) => expect.objectContaining({
                    status: MESSAGE_DISABLED_BY_USER_STATUS,
                    transport,
                })),
            ))
        })
    })
})

