/**
 * @jest-environment node
 */
const faker = require('faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@condo/keystone/test.utils')

const { Message, MarketingMessage, createTestMarketingMessage } = require('@condo/domains/notification/utils/testSchema')

const { selectTarget, getUniqKey, DATE_FORMAT } = require('./sendMarketingMessagesTask')

const {
    SMS_TRANSPORT, EMAIL_TRANSPORT, PUSH_TRANSPORT,
    CUSTOM_CONTENT_MESSAGE_TYPE,
    MARKETING_MESSAGE_FAILED_STATUS,
    MARKETING_MESSAGE_DONE_STATUS,
} = require('../constants/constants')

const index = require('@app/condo/index')

describe('sendMarketingMessagesTask', () => {
    setFakeClientMode(index)

    describe('helpers', () => {
        it('selects proper target', async () => {
            const user = {
                id: faker.datatype.uuid(),
                phone: faker.random.alphaNumeric(8),
                email: `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}.com`,
            }

            expect(selectTarget(SMS_TRANSPORT, user)).toEqual({ phone: user.phone })
            expect(selectTarget(EMAIL_TRANSPORT, user)).toEqual({ email: user.email })
            expect(selectTarget(PUSH_TRANSPORT, user)).toEqual({ user: { id: user.id } })
        })

        it('generates proper uniqKey', async () => {
            const batchId = faker.datatype.uuid()
            const date = dayjs().format(DATE_FORMAT)

            expect(getUniqKey(batchId, date)).toEqual(`${batchId}:${date}`)
        })
    })

    describe('task', () => {
        it('sends push notification of CUSTOM_CONTENT_MESSAGE_TYPE for user', async () => {
            const admin = await makeLoggedInAdminClient()
            const [marketingMessage] = await createTestMarketingMessage(admin)
            const date = dayjs().format(DATE_FORMAT)
            const messagesWhere = {
                type: CUSTOM_CONTENT_MESSAGE_TYPE,
                user: { id: admin.user.id },
                uniqKey: getUniqKey(marketingMessage.id, date),
            }
            const messagesSort = { sortBy: ['createdAt_DESC'] }

            await waitFor(async () => {
                const message = await Message.getOne(admin, messagesWhere, messagesSort)
                const marketingMessage1 = await MarketingMessage.getOne(admin, { id: marketingMessage.id })

                expect(message).not.toBeUndefined()
                expect(marketingMessage1.status).toEqual(MARKETING_MESSAGE_DONE_STATUS)
            })

        })

        it('sends nothing for nonexisting user', async () => {
            const admin = await makeLoggedInAdminClient()
            const [marketingMessage] = await createTestMarketingMessage(admin, { idList: [faker.datatype.uuid()] })
            const date = dayjs().format(DATE_FORMAT)
            const messagesWhere = {
                type: CUSTOM_CONTENT_MESSAGE_TYPE,
                user: { id: admin.user.id },
                uniqKey: getUniqKey(marketingMessage.id, date),
            }
            const messagesSort = { sortBy: ['createdAt_DESC'] }

            await waitFor(async () => {
                const messages = await Message.getAll(admin, messagesWhere, messagesSort)
                const marketingMessage1 = await MarketingMessage.getOne(admin, { id: marketingMessage.id })

                expect(messages.length).toEqual(0)
                expect(marketingMessage1.status).toEqual(MARKETING_MESSAGE_FAILED_STATUS)
            }, { delay: 2000 })

        })
    })

})