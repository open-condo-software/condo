/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { TICKET_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { NO_TELEGRAM_CHAT_FOR_USER } = require('@condo/domains/notification/constants/errors')
const { Message, createTestTelegramUserChat, TelegramUserChat } = require('@condo/domains/notification/utils/testSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { createTestOrganization, createTestOrganizationEmployeeRole, createTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { sendTicketCreatedNotificationsFn } = require('./sendTicketCreatedNotifications')


describe('sendTicketCreatedNotifications', ()  => {
    setFakeClientMode(index)

    let admin,
        organization,
        lang,
        employeeUser,
        employeeUser2,
        ticket,
        property

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const [testOrganization] = await createTestOrganization(admin)
        organization = testOrganization
        lang = get(COUNTRIES, [organization.country, 'locale'], conf.DEFAULT_LOCALE)

        const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canReadTickets: true, canManageTickets: true } )
        employeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
        await createTestOrganizationEmployee(admin, organization, employeeUser.user, role, {
            isRejected: false,
            isAccepted: true,
            isBlocked: false,
        })
        employeeUser2 = await makeClientWithNewRegisteredAndLoggedInUser()
        await createTestOrganizationEmployee(admin, organization, employeeUser2.user, role, {
            isRejected: false,
            isAccepted: true,
            isBlocked: false,
        })

        const [tempProperty] = await createTestProperty(admin, organization)
        property = tempProperty
        const [tempTicket] = await createTestTicket(employeeUser, organization, property)
        ticket = tempTicket
    })

    beforeEach(async () => {
        const telegramUserChats = await TelegramUserChat.getAll(admin, {
            user: { id_in: [employeeUser.user.id, employeeUser2.user.id] },
            deletedAt: null,
        })
        for (const chat of telegramUserChats) {
            await TelegramUserChat.softDelete(admin, chat.id)
        }

        const messages = await Message.getAll(admin, {
            user: { id_in: [employeeUser.user.id, employeeUser2.user.id] },
            deletedAt: null,
        })
        for (const message of messages) {
            await Message.softDelete(admin, message.id)
        }
    })

    it('Sends notification if employee has TelegramUserChat and he is not ticket author', async () => {
        const telegramChatId1 = faker.random.alphaNumeric(8)
        await createTestTelegramUserChat(admin, employeeUser.user, {
            telegramChatId: telegramChatId1,
        })

        const telegramChatId2 = faker.random.alphaNumeric(8)
        await createTestTelegramUserChat(admin, employeeUser2.user, {
            telegramChatId: telegramChatId2,
        })

        await sendTicketCreatedNotificationsFn(ticket.id, lang, organization.id, organization.name)

        await waitFor(async () => {
            const messages = await Message.getAll(admin, {
                type: TICKET_CREATED_TYPE,
                user: { id_in: [employeeUser.user.id, employeeUser2.user.id] },
                deletedAt: null,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages).toHaveLength(1)
            // send message only to employee who not created ticket
            expect(messages[0].status).toEqual('sent')
            expect(messages[0].processingMeta.messageContext.telegramChatId).toEqual(telegramChatId2)
            expect(messages[0].processingMeta.messageContext.userId).toEqual(employeeUser2.user.id)

            expect(messages[0]).toHaveProperty('meta', expect.objectContaining({
                dv: 1,
                data: expect.objectContaining({
                    organizationId: organization.id,
                    organizationName: organization.name,
                    ticketId: ticket.id,
                    ticketClassifier: expect.stringContaining(''),
                    ticketNumber: ticket.number,
                    ticketStatus: expect.stringContaining(''),
                    ticketAddress: ticket.propertyAddress,
                    ticketUnit: expect.stringContaining(ticket.unitName),
                    ticketCreatedAt: dayjs(ticket.createdAt).tz(DEFAULT_ORGANIZATION_TIMEZONE).format('YYYY-MM-DD HH:mm'),
                    ticketDetails: ticket.details,
                    userId: employeeUser2.user.id,
                    url: `${conf.SERVER_URL}/ticket/${ticket.id}`,
                }),
            }))
        })
    })

    it('Does not send notification if employee has not TelegramUserChat', async () => {
        await sendTicketCreatedNotificationsFn(ticket.id, lang, organization.id, organization.name)

        await waitFor(async () => {
            const messages = await Message.getAll(admin, {
                type: TICKET_CREATED_TYPE,
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