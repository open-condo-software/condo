/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { waitFor, UUID_RE, makeLoggedInAdminClient, setFakeClientMode, expectToThrowGQLError } = require('@open-condo/keystone/test.utils')

const { notifyResidentsAboutNewsItem } = require('@condo/domains/news/tasks/notifyResidentsAboutNewsItem')
const { NewsItem, updateTestNewsItem, createTestNewsItem, createTestNewsItemScope, publishTestNewsItem } = require('@condo/domains/news/utils/testSchema')
const {
    NEWS_ITEM_COMMON_MESSAGE_TYPE,
    DEVICE_PLATFORM_ANDROID,
    APP_RESIDENT_ID_ANDROID,
    MESSAGE_SENT_STATUS,
} = require('@condo/domains/notification/constants/constants')
const { syncRemoteClientByTestClient, Message } = require('@condo/domains/notification/utils/testSchema')
const { getRandomTokenData, getRandomFakeSuccessToken } = require('@condo/domains/notification/utils/testSchema/helpers')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestResident } = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')


describe('notifyResidentsAboutNewsItem', () => {
    setFakeClientMode(index)

    let adminClient

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('Basic logic', () => {

        test('the user receives a push notification on a news item created and does not receive notification for 2nd news item', async () => {
            const residentClient1 = await makeClientWithResidentUser()
            const [o10n] = await createTestOrganization(adminClient)
            const [property] = await createTestProperty(adminClient, o10n)

            const unitType1 = FLAT_UNIT_TYPE
            const unitName1 = faker.lorem.word()

            const [resident] = await createTestResident(adminClient, residentClient1.user, property, {
                unitType: unitType1,
                unitName: unitName1,
            })

            // News item for particular unit
            const [newsItem1] = await createTestNewsItem(
                adminClient,
                o10n,
                {
                    title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                    body: 'Commodo viverra maecenas accumsan lacus vel facilisis volutpat est velit. Et malesuada fames ac turpis egestas sed tempus urna et. At augue eget arcu dictum varius duis at. Tempus quam pellentesque nec nam aliquam sem et tortor consequat. Enim sit amet venenatis urna cursus eget nunc scelerisque viverra. Urna cursus eget nunc scelerisque viverra. Ornare aenean euismod elementum nisi quis eleifend quam. Quis hendrerit dolor magna eget est. Gravida cum sociis natoque penatibus et.',
                })
            await createTestNewsItemScope(adminClient, newsItem1, {
                property: { connect: { id: property.id } },
                unitType: unitType1,
                unitName: unitName1,
            })

            const payload = getRandomTokenData({
                devicePlatform: DEVICE_PLATFORM_ANDROID,
                appId: APP_RESIDENT_ID_ANDROID,
                pushToken: getRandomFakeSuccessToken(),
            })

            await syncRemoteClientByTestClient(residentClient1, payload)

            const messageWhere = { user: { id: residentClient1.user.id }, type: NEWS_ITEM_COMMON_MESSAGE_TYPE }

            // Publish news item to make it send-able
            const [updatedItem1] = await publishTestNewsItem(adminClient, newsItem1.id)
            await notifyResidentsAboutNewsItem(newsItem1.id)

            await waitFor(async () => {
                const messages = await Message.getAll(adminClient, messageWhere)

                expect(messages).toBeDefined()
                expect(messages).toHaveLength(1)

                const message1 = messages[0]

                expect(message1).toBeDefined()
                expect(message1.id).toMatch(UUID_RE)

                expect(message1).toEqual(expect.objectContaining({
                    status: MESSAGE_SENT_STATUS,
                    processingMeta: expect.objectContaining({
                        // old way check
                        transport: 'push',

                        // ADR-7 way check
                        transportsMeta: [expect.objectContaining({
                            transport: 'push',
                        })],
                    }),
                    meta: expect.objectContaining({
                        title: 'Lorem ipsum dolor sit amet, consectetur...',
                        body: 'Commodo viverra maecenas accumsan lacus vel facilisis volutpat est velit. Et malesuada fames ac turpis egestas sed tempus urna et. At augue eget...',
                        data: expect.objectContaining({
                            newsItemId: newsItem1.id,
                            residentId: resident.id,
                            userId: residentClient1.user.id,
                            userRelatedResidentsIds: resident.id,
                            organizationId: o10n.id,
                            validBefore: null,
                            dateCreated: updatedItem1.deliverAt,
                        }),
                    }),
                }))
            })

            // This news item shouldn't send notification for the same user
            const [newsItem2] = await createTestNewsItem(adminClient, o10n)
            await createTestNewsItemScope(adminClient, newsItem2, {
                property: { connect: { id: property.id } },
            })

            // Publish 2nd news item...
            await publishTestNewsItem(adminClient, newsItem2.id)
            await notifyResidentsAboutNewsItem(newsItem2.id)

            //... and shouldn't see any sent message for it
            await waitFor(async () => {
                const messages = await Message.getAll(adminClient, messageWhere)

                expect(messages).toHaveLength(2)
                expect(messages).toEqual(expect.arrayContaining([
                    expect.objectContaining({ type: 'NEWS_ITEM_COMMON_MESSAGE_TYPE', status: 'sent' }),
                    expect.objectContaining({
                        type: 'NEWS_ITEM_COMMON_MESSAGE_TYPE',
                        status: 'throttled',
                        meta: expect.objectContaining({
                            data: expect.objectContaining({ newsItemId: newsItem2.id }),
                        }),
                        processingMeta: expect.objectContaining({ error: expect.stringContaining('1 message per 3600 sec for user. The latest message was at ') }),
                    }),
                ]))
            })
        })

        test('cannot run sending news items if news item is deleted', async () => {
            const [o10n] = await createTestOrganization(adminClient)
            const [newsItem] = await createTestNewsItem(adminClient, o10n)
            await createTestNewsItemScope(adminClient, newsItem)
            await publishTestNewsItem(adminClient, newsItem.id)
            await updateTestNewsItem(adminClient, newsItem.id, { deletedAt: (new Date()).toISOString() })
            await expect(notifyResidentsAboutNewsItem(newsItem.id)).rejects.toThrow('Trying to send deleted news item')
        })

        test('cannot run sending news items if news item is sent', async () => {
            const [o10n] = await createTestOrganization(adminClient)
            const [newsItem] = await createTestNewsItem(adminClient, o10n)
            await createTestNewsItemScope(adminClient, newsItem)
            await publishTestNewsItem(adminClient, newsItem.id)
            await notifyResidentsAboutNewsItem(newsItem.id)
            await expect(notifyResidentsAboutNewsItem(newsItem.id)).rejects.toThrow('Trying to send news item which already been sent')
        })

        test('cannot run sending news items if news item is not published', async () => {
            const [o10n] = await createTestOrganization(adminClient)
            const [newsItem] = await createTestNewsItem(adminClient, o10n)
            await createTestNewsItemScope(adminClient, newsItem)
            await expect(notifyResidentsAboutNewsItem(newsItem.id)).rejects.toThrow('Trying to send unpublished news item')
        })
    })

    describe('NewsItem', () => {
        // NOTE: Why is this test not in the file "@condo/domains/notification/schema/NewsItem.test.js"?
        // We cannot update the "sentAt" field with client utilities (which means we cannot update it with test utilities either).
        // Therefore, it is necessary to run sending news items (notifyResidentsAboutNewsItem)
        test('must throw an error on user trying to edit the news item which already been sent', async () => {
            const [o10n] = await createTestOrganization(adminClient)
            const [newsItem] = await createTestNewsItem(adminClient, o10n)
            await createTestNewsItemScope(adminClient, newsItem)
            await publishTestNewsItem(adminClient, newsItem.id)
            await notifyResidentsAboutNewsItem(newsItem.id)
            const sentNewsItem = await NewsItem.getOne(adminClient, { id: newsItem.id })
            expect(sentNewsItem.sentAt).not.toBeNull()
            await expectToThrowGQLError(
                async () => await updateTestNewsItem(adminClient, sentNewsItem.id, { title: faker.lorem.words(3) }),
                {
                    code: 'BAD_USER_INPUT',
                    type: 'EDIT_DENIED_ALREADY_SENT',
                    message: 'The sent news item is restricted from editing',
                    mutation: 'updateNewsItem',
                    messageForUser: 'api.newsItem.EDIT_DENIED_ALREADY_SENT',
                },
            )
        })
    })
})
