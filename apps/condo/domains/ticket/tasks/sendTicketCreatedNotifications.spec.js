/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { TICKET_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { NO_TELEGRAM_CHAT_FOR_USER } = require('@condo/domains/notification/constants/errors')
const { Message, createTestTelegramUserChat, TelegramUserChat } = require('@condo/domains/notification/utils/testSchema')
const { createTestOrganization, createTestOrganizationEmployeeRole, createTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { sendTicketCreatedNotifications } = require('./sendTicketCreatedNotifications')


describe('sendTicketCreatedNotifications', ()  => {
    setFakeClientMode(index)

    let admin,
        organization,
        lang,
        employeeUser,
        ticket

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const [testOrganization] = await createTestOrganization(admin)
        organization = testOrganization
        lang = get(COUNTRIES, [organization.country, 'locale'], conf.DEFAULT_LOCALE)

        employeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
        const [role] = await createTestOrganizationEmployeeRole(admin, organization)
        await createTestOrganizationEmployee(admin, organization, employeeUser.user, role, {
            isRejected: false,
            isAccepted: true,
            isBlocked: false,
        })

        const [property] = await createTestProperty(admin, organization)
        const [tempTicket] = await createTestTicket(admin, organization, property)
        ticket = tempTicket
    })

    beforeEach(async () => {
        const telegramUserChats = await TelegramUserChat.getAll(admin, {
            user: { id: employeeUser.user.id },
            deletedAt: null,
        })

        for (const chat of telegramUserChats) {
            await TelegramUserChat.softDelete(admin, chat.id)
        }
    })

    it('Sends notification if employee has TelegramUserChat', async () => {
        const telegramChatId = faker.random.alphaNumeric(8)
        await createTestTelegramUserChat(admin, employeeUser.user, {
            telegramChatId,
        })
        await sendTicketCreatedNotifications(ticket.id, lang, organization.id, organization.name)

        await waitFor(async () => {
            const messages = await Message.getAll(admin, {
                type: TICKET_CREATED_TYPE,
                user: { id: employeeUser.user.id },
                deletedAt: null,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages[0].status).toEqual('sent')
            expect(messages[0].processingMeta.messageContext.telegramChatId).toEqual(telegramChatId)
            expect(messages[0].processingMeta.messageContext.userId).toEqual(employeeUser.user.id)
        })
    })

    it('Does not send notification if employee has not TelegramUserChat', async () => {
        await sendTicketCreatedNotifications(ticket.id, lang, organization.id, organization.name)

        await waitFor(async () => {
            const messages = await Message.getAll(admin, {
                type: TICKET_CREATED_TYPE,
                user: { id: employeeUser.user.id },
                deletedAt: null,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages[0].status).toEqual('error')
            expect(messages[0].processingMeta.transportsMeta[0].exception.message).toEqual(NO_TELEGRAM_CHAT_FOR_USER)
        })
    })
})