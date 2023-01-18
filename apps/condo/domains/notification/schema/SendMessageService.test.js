const faker = require('faker')
const { makeLoggedInAdminClient, UUID_RE, DATETIME_RE, waitFor } = require('@open-condo/keystone/test.utils')
const {
    MESSAGE_SENDING_STATUS,
    MESSAGE_RESENDING_STATUS,
    MESSAGE_SENT_STATUS, EMAIL_TRANSPORT,
} = require('@condo/domains/notification/constants/constants')

const { sendMessageByTestClient, resendMessageByTestClient, Message, createTestMessage } = require('../utils/testSchema')

const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

describe('SendMessageService', () => {
    describe('sendMessage', () => {
        describe('called by Admin', () => {
            it('returns sending status', async () => {
                const admin = await makeLoggedInAdminClient()

                const [data] = await sendMessageByTestClient(admin)
                expect(data.id).toMatch(UUID_RE)
                expect(data.status).toEqual(MESSAGE_SENDING_STATUS)
            })

            it('returns uniqKey value', async () => {
                const admin = await makeLoggedInAdminClient()
                const uniqKey = faker.datatype.uuid()

                const [data] = await sendMessageByTestClient(admin, { uniqKey })
                const message = await Message.getOne(admin, { id: data.id })

                expect(message.id).toMatch(UUID_RE)
                expect(message.uniqKey).toEqual(uniqKey)
            })

            it('creates Message sets "sent" status on successful delivery', async () => {
                const admin = await makeLoggedInAdminClient()

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

            describe('with INVITE_NEW_EMPLOYEE message type', () => {
                it('throws error when "inviteCode" is not specified in meta', async () => {
                    const admin = await makeLoggedInAdminClient()
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
                                message: 'Missing value for required "meta.{attr}" attribute',
                            },
                        }])
                        expect(data).toEqual({ 'result': null })
                    })
                })

                it('throws error when unregistered attribute is provided in "meta"', async () => {
                    const admin = await makeLoggedInAdminClient()
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
                                message: 'Unknown attribute "{attr}" provided to "meta" variable',
                            },
                        }])
                        expect(data).toEqual({ 'result': null })
                    })
                })
            })

            it('throws error when "emailFrom" attribute is not provided', async () => {
                const admin = await makeLoggedInAdminClient()
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
                const admin = await makeLoggedInAdminClient()
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
                const admin = await makeLoggedInAdminClient()
                await catchErrorFrom(async () => {
                    await sendMessageByTestClient(admin, {
                        emailFrom: faker.internet.email(),
                        type: 'unknownMessageType',
                    })
                }, ({ errors, data }) => {
                    expect(errors).toMatchObject([{
                        message: 'Variable "$data" got invalid value "unknownMessageType" at "data.type"; Value "unknownMessageType" does not exist in "SendMessageType" enum.',
                    }])
                    expect(data).toBeUndefined()
                })
            })

            it('throws error when not supported value of "meta.dv" attribute is provided', async () => {
                const admin = await makeLoggedInAdminClient()
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
                const admin = await makeLoggedInAdminClient()
                const [message] = await createTestMessage(admin, { status: MESSAGE_SENT_STATUS })
                const [data] = await resendMessageByTestClient(admin, message)
                expect(data.id).toMatch(UUID_RE)
                expect(data.status).toEqual(MESSAGE_RESENDING_STATUS)
            })
        })
    })
})

