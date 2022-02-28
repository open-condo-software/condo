const faker = require('faker')
const { makeLoggedInAdminClient, UUID_RE, DATETIME_RE } = require('@core/keystone/test.utils')
const {
    MESSAGE_SENDING_STATUS,
    MESSAGE_RESENDING_STATUS,
    MESSAGE_DELIVERED_STATUS,
    JSON_UNKNOWN_ATTR_NAME_ERROR,
} = require('@condo/domains/notification/constants/constants')

const { sendMessageByTestClient, resendMessageByTestClient, Message, createTestMessage } = require('../utils/testSchema')

const { sleep } = require('@condo/domains/common/utils/sleep')
const { catchErrorFrom } = require('@condo/domains/common/utils/testSchema')

describe('SendMessageService', () => {
    describe('sendMessage', () => {
        describe('called by Admin', () => {
            it('returns sending status', async () => {
                const admin = await makeLoggedInAdminClient()

                const [data] = await sendMessageByTestClient(admin)
                expect(data.id).toMatch(UUID_RE)
                expect(data.status).toEqual(MESSAGE_SENDING_STATUS)
            })

            it('creates Message sets "delivered" status on successful delivery', async () => {
                const admin = await makeLoggedInAdminClient()

                const [data, attrs] = await sendMessageByTestClient(admin)

                // give worker some time
                await sleep(1000)

                const messages = await Message.getAll(admin, { id: data.id })
                const message = messages[0]

                expect(message.lang).toEqual(attrs.lang)
                expect(message.type).toEqual(attrs.type)
                expect(message.status).toEqual(MESSAGE_DELIVERED_STATUS)
                expect(message.deliveredAt).toMatch(DATETIME_RE)
                expect(message.createdBy).toEqual(expect.objectContaining({ id: admin.user.id }))
                expect(message.updatedBy).toEqual(null)
                expect(message.organization).toEqual(null)
                expect(message.user).toEqual(expect.objectContaining({ id: admin.user.id }))
                expect(message.processingMeta).toEqual(expect.objectContaining({
                    dv: 1,
                    step: 'delivered',
                    transport: 'email',
                    messageContext: expect.objectContaining({
                        to: attrs.to.email,
                    }),
                }))
            })

            describe('with INVITE_NEW_EMPLOYEE message type', () => {
                it('throws error when "meta.inviteCode" is not provided', async () => {
                    const admin = await makeLoggedInAdminClient()
                    try {
                        await sendMessageByTestClient(admin, { meta: { dv: 1 } })
                    } catch (e) {
                        expect(e.errors[0]).toMatchObject({
                            'message': '[json:noRequiredAttr:meta] no inviteCode value',
                            'name': 'GraphQLError',
                            'path': ['result'],
                        })
                        expect(e.data).toEqual({ 'result': null })
                    }
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
                            'message': `${JSON_UNKNOWN_ATTR_NAME_ERROR}meta] unregisteredAttrName is redundant or unknown`,
                            'name': 'GraphQLError',
                            'path': ['result'],
                        }])
                        expect(data).toEqual({ 'result': null })
                    })
                })
            })
        })
    })

    describe('resendMessage', () => {
        describe('called by Admin', () => {
            it('returns "resending" status', async () => {
                const admin = await makeLoggedInAdminClient()
                const [message] = await createTestMessage(admin, { status: MESSAGE_DELIVERED_STATUS })
                const [data] = await resendMessageByTestClient(admin, message)
                expect(data.id).toMatch(UUID_RE)
                expect(data.status).toEqual(MESSAGE_RESENDING_STATUS)
            })
        })
    })
})

