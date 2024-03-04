const dayjs = require('dayjs')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getSchemaCtx, getById, itemsQuery } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')
const { TICKET_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { buildFullClassifierName } = require('@condo/domains/ticket/utils')
const { TicketClassifier } = require('@condo/domains/ticket/utils/serverSchema')
const { getUsersAvailableToReadTicketByPropertyScope } = require('@condo/domains/ticket/utils/serverSchema/propertyScope')


const EMPTY_CONTENT = '—'

/**
 * Sends notifications after ticket created
 */
const sendTicketCreatedNotifications = async (ticketId, lang, organizationId, organizationName) => {
    try {
        const { keystone: context } = getSchemaCtx('Ticket')
        setLocaleForKeystoneContext(context, lang)

        const createdTicket = await getById('Ticket', ticketId)
        const ticketStatus = await getById('TicketStatus', createdTicket.status)
        const ticketUrl = `${conf.SERVER_URL}/ticket/${ticketId}`
        const { count: ticketFilesCount } = await itemsQuery('TicketFile', {
            where: {
                ticket: { id: ticketId },
                deletedAt: null,
            },
        }, { meta: true })
        const classifier = await TicketClassifier.getOne(context, { id: createdTicket.classifier })

        const ticketStatusName = i18n(`ticket.status.${ticketStatus.type}.name`, { locale: lang })
        const ticketUnitType = i18n(`field.UnitType.prefix.${createdTicket.unitType}`, { locale: lang }).toLowerCase()
        const OpenTicketMessage = i18n(`notification.messages.${TICKET_CREATED_TYPE}.telegram.openTicket`, { locale: lang })
        const TicketFilesCountMessage = i18n(`notification.messages.${TICKET_CREATED_TYPE}.telegram.ticketFilesCount`, { locale: lang, meta: { ticketFilesCount } })

        const ticketDetails = [get(createdTicket, 'details', '').trim(), ticketFilesCount && TicketFilesCountMessage].filter(Boolean).join(' ')
        const ticketClassifier = buildFullClassifierName(classifier)

        const users = await getUsersAvailableToReadTicketByPropertyScope({
            ticketOrganizationId: createdTicket.organization,
            ticketPropertyId: createdTicket.property,
            ticketExecutorId: createdTicket.executor,
            ticketAssigneeId: createdTicket.executor,
            ticketCategoryClassifierId: createdTicket.categoryClassifier,
        })
        const usersWithoutAuthor = users.filter(userId => createdTicket.createdBy !== userId)

        for (const employeeUserId of usersWithoutAuthor) {
            await sendMessage(context, {
                lang,
                to: { user: { id: employeeUserId } },
                type: TICKET_CREATED_TYPE,
                meta: {
                    dv: 1,
                    data: {
                        organizationId: organizationId,
                        organizationName: organizationName,
                        ticketId,
                        ticketClassifier,
                        ticketNumber: createdTicket.number,
                        ticketStatus: ticketStatusName,
                        ticketAddress: createdTicket.propertyAddress,
                        ticketUnit: createdTicket.unitName ? `${ticketUnitType} ${createdTicket.unitName}` : EMPTY_CONTENT,
                        ticketCreatedAt: dayjs(createdTicket.createdAt).format('YYYY-MM-DD HH:mm'),
                        ticketDetails,
                        userId: employeeUserId,
                        url: ticketUrl,
                    },
                    telegramMeta: {
                        inlineKeyboard: [[{ text: OpenTicketMessage, url: ticketUrl }]],
                    },
                },
                sender: { dv: 1, fingerprint: 'send-notifications' },
                organization: { id: organizationId },
            })
        }
    } catch (e) {
        console.log('sendTicketCreatedNotifications:error::', e)
    }
}

module.exports = {
    sendTicketCreatedNotifications,
}