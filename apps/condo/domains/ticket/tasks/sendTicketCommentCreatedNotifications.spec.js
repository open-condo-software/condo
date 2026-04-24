/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')

const { TICKET_COMMENT_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { NO_TELEGRAM_CHAT_FOR_USER } = require('@condo/domains/notification/constants/errors')
const { 
    Message,
    createTestTelegramUserChat,
    updateTestNotificationUserSetting,
    NotificationUserSetting,
    syncRemoteClientWithPushTokenByTestClient,
} = require('@condo/domains/notification/utils/testSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { createTestOrganization, createTestOrganizationEmployeeRole, createTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket, createTestTicketComment } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')


describe('sendTicketCommentCreatedNotifications', ()  => {
    setFakeClientMode(index)

    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    beforeEach(async () => {
        const globalSettings = await NotificationUserSetting.getAll(admin, {
            user_is_null: true,
            deletedAt: null,
        })
        for (const setting of globalSettings) {
            await updateTestNotificationUserSetting(admin, setting.id, {
                deletedAt: new Date(),
            })
        }
    })

    it('Sends notification if employee has TelegramUserChat and he is not comment author', async () => {
        const [organization] = await createTestOrganization(admin)
        const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canReadTickets: true, canManageTickets: true } )
        
        const employeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
        await createTestOrganizationEmployee(admin, organization, employeeUser.user, role, {
            isRejected: false,
            isAccepted: true,
            isBlocked: false,
        })
        
        const employeeUser2 = await makeClientWithNewRegisteredAndLoggedInUser()
        await createTestOrganizationEmployee(admin, organization, employeeUser2.user, role, {
            isRejected: false,
            isAccepted: true,
            isBlocked: false,
        })

        const [property] = await createTestProperty(admin, organization)

        const telegramChatId1 = faker.random.alphaNumeric(8)
        await createTestTelegramUserChat(admin, employeeUser.user, {
            telegramChatId: telegramChatId1,
        })

        const telegramChatId2 = faker.random.alphaNumeric(8)
        await createTestTelegramUserChat(admin, employeeUser2.user, {
            telegramChatId: telegramChatId2,
        })
        await syncRemoteClientWithPushTokenByTestClient(employeeUser2)

        const [ticket] = await createTestTicket(employeeUser, organization, property)
        const [ticketComment] = await createTestTicketComment(employeeUser, ticket, employeeUser.user)

        await waitFor(async () => {
            const messages = await Message.getAll(admin, {
                type: TICKET_COMMENT_CREATED_TYPE,
                user: { id_in: [employeeUser.user.id, employeeUser2.user.id] },
                deletedAt: null,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages).toHaveLength(1)
            // send message only to employee who not created comment
            expect(messages[0].status).toEqual('sent')
            expect(messages[0].processingMeta.transportsMeta[0].messageContext.telegramChatId).toEqual(telegramChatId2)
            expect(messages[0].processingMeta.transportsMeta[0].messageContext.userId).toEqual(employeeUser2.user.id)

            expect(messages[0]).toHaveProperty('meta', expect.objectContaining({
                dv: 1,
                data: expect.objectContaining({
                    organizationId: organization.id,
                    organizationName: organization.name,
                    commentId: ticketComment.id,
                    commentContent: ticketComment.content,
                    commentType: ticketComment.type,
                    commentTypeMessage: expect.stringContaining(''),
                    commentCreatedAt: dayjs(ticketComment.createdAt).tz(DEFAULT_ORGANIZATION_TIMEZONE).format('YYYY-MM-DD HH:mm'),
                    ticketId: ticket.id,
                    ticketDetails: ticket.details,
                    ticketClassifier: expect.stringContaining(''),
                    ticketNumber: ticket.number,
                    ticketStatus: expect.stringContaining(''),
                    ticketAddress: ticket.propertyAddress,
                    ticketUnit: expect.stringContaining(ticket.unitName),
                    userId: employeeUser2.user.id,
                    url: `${conf.SERVER_URL}/ticket/${ticket.id}`,
                }),
            }))
        })
    })

    it('Does not send notification if employee has not TelegramUserChat', async () => {
        const [organization] = await createTestOrganization(admin)
        const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canReadTickets: true, canManageTickets: true } )
        
        const employeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
        await createTestOrganizationEmployee(admin, organization, employeeUser.user, role, {
            isRejected: false,
            isAccepted: true,
            isBlocked: false,
        })
        
        const employeeUser2 = await makeClientWithNewRegisteredAndLoggedInUser()
        await createTestOrganizationEmployee(admin, organization, employeeUser2.user, role, {
            isRejected: false,
            isAccepted: true,
            isBlocked: false,
        })

        const [property] = await createTestProperty(admin, organization)
        const [ticket] = await createTestTicket(employeeUser, organization, property)
        const [ticketComment] = await createTestTicketComment(employeeUser, ticket, employeeUser.user)

        await waitFor(async () => {
            const messages = await Message.getAll(admin, {
                type: TICKET_COMMENT_CREATED_TYPE,
                user: { id_in: [employeeUser.user.id, employeeUser2.user.id] },
                deletedAt: null,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages).toHaveLength(1)
            expect(messages[0].status).toEqual('error')
            expect(messages[0].processingMeta.transportsMeta[0].exception.message).toEqual(NO_TELEGRAM_CHAT_FOR_USER)
            expect(messages[0].meta.data.organizationId).toEqual(organization.id)
            expect(messages[0].meta.data.ticketId).toEqual(ticket.id)
            expect(messages[0].meta.data.userId).toEqual(employeeUser2.user.id)
        })
    })
})