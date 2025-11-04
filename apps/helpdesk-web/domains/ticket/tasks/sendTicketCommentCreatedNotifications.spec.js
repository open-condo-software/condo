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
const { Message, createTestTelegramUserChat, TelegramUserChat } = require('@condo/domains/notification/utils/testSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { createTestOrganization, createTestOrganizationEmployeeRole, createTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket, createTestTicketComment } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { sendTicketCommentCreatedNotifications } = require('./sendTicketCommentCreatedNotifications')


describe('sendTicketCommentCreatedNotifications', ()  => {
    setFakeClientMode(index)

    let admin,
        organization,
        employeeClient,
        commentAuthorClient,
        ticket

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const [testOrganization] = await createTestOrganization(admin)
        organization = testOrganization

        const activeEmployeeData = {
            isRejected: false,
            isAccepted: true,
            isBlocked: false,
        }

        employeeClient = await makeClientWithNewRegisteredAndLoggedInUser()
        const [role] = await createTestOrganizationEmployeeRole(admin, organization)
        await createTestOrganizationEmployee(admin, organization, employeeClient.user, role, activeEmployeeData)

        commentAuthorClient = await makeClientWithNewRegisteredAndLoggedInUser()
        const [roleWithCanManageComments] = await createTestOrganizationEmployeeRole(admin, organization, { canManageTicketComments: true })
        await createTestOrganizationEmployee(admin, organization, commentAuthorClient.user, roleWithCanManageComments, activeEmployeeData)

        const [property] = await createTestProperty(admin, organization)
        const [tempTicket] = await createTestTicket(admin, organization, property)
        ticket = tempTicket
    })

    beforeEach(async () => {
        const telegramUserChats = await TelegramUserChat.getAll(admin, {
            user: { id: employeeClient.user.id },
            deletedAt: null,
        })

        for (const chat of telegramUserChats) {
            await TelegramUserChat.softDelete(admin, chat.id)
        }
    })

    it('Sends notification if employee has TelegramUserChat and he is not comment author', async () => {
        const telegramChatId = faker.random.alphaNumeric(8)
        await createTestTelegramUserChat(admin, employeeClient.user, {
            telegramChatId,
        })

        const [ticketComment] = await createTestTicketComment(commentAuthorClient, ticket, commentAuthorClient.user)

        await sendTicketCommentCreatedNotifications(ticketComment.id, ticket.id)

        const messagesForCommentAuthor = await Message.getAll(admin, {
            type: TICKET_COMMENT_CREATED_TYPE,
            user: { id: commentAuthorClient.user.id },
            deletedAt: null,
        }, { sortBy: 'createdAt_DESC' })

        expect(messagesForCommentAuthor).toHaveLength(0)

        await waitFor(async () => {
            const messages = await Message.getAll(admin, {
                type: TICKET_COMMENT_CREATED_TYPE,
                user: { id: employeeClient.user.id },
                deletedAt: null,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages[0].status).toEqual('sent')
            expect(messages[0].processingMeta.messageContext.telegramChatId).toEqual(telegramChatId)
            expect(messages[0].processingMeta.messageContext.userId).toEqual(employeeClient.user.id)

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
                    userId: employeeClient.user.id,
                    url: `${conf.SERVER_URL}/ticket/${ticket.id}`,
                }),
            }))
        })
    })

    it('Does not send notification if employee has not TelegramUserChat', async () => {
        const [ticketComment] = await createTestTicketComment(commentAuthorClient, ticket, commentAuthorClient.user)

        await sendTicketCommentCreatedNotifications(ticketComment.id, ticket.id)

        await waitFor(async () => {
            const messages = await Message.getAll(admin, {
                type: TICKET_COMMENT_CREATED_TYPE,
                user: { id: employeeClient.user.id },
                deletedAt: null,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages[0].status).toEqual('error')
            expect(messages[0].processingMeta.transportsMeta[0].exception.message).toEqual(NO_TELEGRAM_CHAT_FOR_USER)
        })
    })
})