/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const truncate = require('lodash/truncate')

const { waitFor, UUID_RE, makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { NEWS_SENDING_TTL_IN_SEC, MESSAGE_TITLE_MAX_LEN, MESSAGE_BODY_MAX_LEN } = require('@condo/domains/news/constants/common')
const { notifyResidentsAboutNewsItem } = require('@condo/domains/news/tasks/notifyResidentsAboutNewsItem')
const { updateTestNewsItem, createTestNewsItem, createTestNewsItemScope, publishTestNewsItem } = require('@condo/domains/news/utils/testSchema')
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

            const newsItemTitle = faker.lorem.words(100)
            const newsItemBody = faker.lorem.words(100)

            // NewsItem for particular unit
            const [newsItem1] = await createTestNewsItem(
                adminClient,
                o10n,
                {
                    title: newsItemTitle,
                    body: newsItemBody,
                }
            )

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

            // Publish NewsItem to make it sendable
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
                        title: truncate(newsItemTitle, { length: MESSAGE_TITLE_MAX_LEN, separator: ' ', omission: '...' }),
                        body: truncate(newsItemBody, { length: MESSAGE_BODY_MAX_LEN, separator: ' ', omission: '...' }),
                        data: expect.objectContaining({
                            newsItemId: newsItem1.id,
                            residentId: resident.id,
                            userId: residentClient1.user.id,
                            userRelatedResidentsIds: resident.id,
                            organizationId: o10n.id,
                            validBefore: null,
                            dateCreated: updatedItem1.sendAt,
                        }),
                    }),
                }))
            })

            // This NewsItem shouldn't send notification for the same user
            const [newsItem2] = await createTestNewsItem(adminClient, o10n)
            await createTestNewsItemScope(adminClient, newsItem2, {
                property: { connect: { id: property.id } },
            })

            // Publish 2nd NewsItem...
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

        test('notify resident about NewsItem in all NewItemScope', async () => {
            const residentClient1 = await makeClientWithResidentUser()
            const [o10n] = await createTestOrganization(adminClient)
            const [property] = await createTestProperty(adminClient, o10n)

            const unitType1 = FLAT_UNIT_TYPE
            const unitName1 = faker.lorem.word()

            const [resident] = await createTestResident(adminClient, residentClient1.user, property, {
                unitType: unitType1,
                unitName: unitName1,
            })

            const newsItemTitle = faker.lorem.words(100)
            const newsItemBody = faker.lorem.words(100)

            // NewsItem for particular unit
            const [newsItem1] = await createTestNewsItem(
                adminClient,
                o10n,
                {
                    title: newsItemTitle,
                    body: newsItemBody,
                }
            )

            // create NewsItemScopes without Residents, that testing pushing newsItem in big scope
            for (let i = 0; i <= 100; i++) {
                await createTestNewsItemScope(adminClient, newsItem1, {
                    property: { connect: { id: property.id } },
                    unitType: FLAT_UNIT_TYPE,
                    unitName: faker.lorem.word(),
                })
            }

            // create NewsItemScope with Resident
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

            // Publish NewsItem to make it sendable
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
                        title: truncate(newsItemTitle, { length: MESSAGE_TITLE_MAX_LEN, separator: ' ', omission: '...' }),
                        body: truncate(newsItemBody, { length: MESSAGE_BODY_MAX_LEN, separator: ' ', omission: '...' }),
                        data: expect.objectContaining({
                            newsItemId: newsItem1.id,
                            residentId: resident.id,
                            userId: residentClient1.user.id,
                            userRelatedResidentsIds: resident.id,
                            organizationId: o10n.id,
                            validBefore: null,
                            dateCreated: updatedItem1.sendAt,
                        }),
                    }),
                }))
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
            await waitFor(async () => {
                await expect(notifyResidentsAboutNewsItem(newsItem.id)).rejects.toThrow('Trying to send news item which already been sent')
            }, { delay: (NEWS_SENDING_TTL_IN_SEC) * 1000 })
        })

        test('cannot run sending news items if news item is not published', async () => {
            const [o10n] = await createTestOrganization(adminClient)
            const [newsItem] = await createTestNewsItem(adminClient, o10n)
            await createTestNewsItemScope(adminClient, newsItem)
            await expect(notifyResidentsAboutNewsItem(newsItem.id)).rejects.toThrow('Trying to send unpublished news item')
        })

        test('cannot run sending news items if this news item was sent recently', async () => {
            const [o10n] = await createTestOrganization(adminClient)
            const [newsItem] = await createTestNewsItem(adminClient, o10n)
            await createTestNewsItemScope(adminClient, newsItem)
            await publishTestNewsItem(adminClient, newsItem.id)
            await expect(notifyResidentsAboutNewsItem(newsItem.id)).resolves.toBeUndefined()
            await expect(notifyResidentsAboutNewsItem(newsItem.id)).rejects.toThrow('Trying to send news item which already was sent recently')
            await waitFor(async () => {
                await expect(notifyResidentsAboutNewsItem(newsItem.id)).rejects.toThrow('Trying to send news item which already been sent')
            }, { delay: (NEWS_SENDING_TTL_IN_SEC) * 1000 })
        })
    })
})
