const dayjs = require('dayjs')
const { get } = require('lodash')
const { v4: uuid } = require('uuid')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getByCondition, getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')
const { TICKET_COMMENT_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE } = require('@condo/domains/ticket/constants')
const { buildFullClassifierName } = require('@condo/domains/ticket/utils')
const { TicketClassifier } = require('@condo/domains/ticket/utils/serverSchema')
const { getUsersAvailableToReadTicketByPropertyScope } = require('@condo/domains/ticket/utils/serverSchema/propertyScope')
const { STAFF, RESIDENT } = require('@condo/domains/user/constants/common')


const appLogger = getLogger('condo')
const taskLogger = appLogger.child({ module: 'tasks/sendTicketCommentCreatedNotifications' })

const getCommentTypeMessage = (commentType, commentAuthorType, lang) => {
    const CommentToResidentMessage = i18n(`notification.messages.${TICKET_COMMENT_CREATED_TYPE}.telegram.ticketType.toResident`, { locale: lang })
    const CommentFromResidentMessage = i18n(`notification.messages.${TICKET_COMMENT_CREATED_TYPE}.telegram.ticketType.fromResident`, { locale: lang })
    const ResidentCommentMessage = i18n(`notification.messages.${TICKET_COMMENT_CREATED_TYPE}.telegram.ticketType.resident`, { locale: lang })
    const OrganizationCommentMessage = i18n(`notification.messages.${TICKET_COMMENT_CREATED_TYPE}.telegram.ticketType.organization`, { locale: lang })

    if (commentType === ORGANIZATION_COMMENT_TYPE) {
        return OrganizationCommentMessage
    } else if (commentType === RESIDENT_COMMENT_TYPE) {
        if (commentAuthorType === STAFF) {
            return CommentToResidentMessage
        } else if (commentAuthorType === RESIDENT) {
            return CommentFromResidentMessage
        } else {
            return ResidentCommentMessage
        }
    }

    return ''
}

const EMPTY_CONTENT = '—'

/**
 * Sends notifications after ticket comment created
 */
const sendTicketCommentCreatedNotifications = async (commentId, ticketId) => {
    const taskId = uuid()
    try {
        const { keystone: context } = getSchemaCtx('Ticket')

        const ticket = await getById('Ticket', ticketId)
        const organization = await getByCondition('Organization', {
            id: get(ticket, 'organization', null),
            deletedAt: null,
        })
        const organizationCountry = get(organization, 'country', conf.DEFAULT_LOCALE)
        const lang = get(COUNTRIES, [organizationCountry, 'locale'], conf.DEFAULT_LOCALE)

        setLocaleForKeystoneContext(context, lang)

        const createdComment = await getById('TicketComment', commentId)
        const commentAuthor = await getById('User', createdComment.user)
        const commentAuthorType = get(commentAuthor, 'type', STAFF)
        const commentType = get(createdComment, 'type', ORGANIZATION_COMMENT_TYPE)
        const ticketStatus = await getById('TicketStatus', ticket.status)
        const ticketUrl = `${conf.SERVER_URL}/ticket/${ticketId}`
        const classifier = await TicketClassifier.getOne(context, { id: ticket.classifier })

        const OpenTicketMessage = i18n(`notification.messages.${TICKET_COMMENT_CREATED_TYPE}.telegram.openTicket`, { locale: lang })
        const TicketStatusName = i18n(`ticket.status.${ticketStatus.type}.name`, { locale: lang })
        const TicketUnitType = i18n(`field.UnitType.prefix.${ticket.unitType}`, { locale: lang }).toLowerCase()
        const CommentTypeMessage = getCommentTypeMessage(commentType, commentAuthorType, lang)

        const ticketClassifier = buildFullClassifierName(classifier)

        const users = await getUsersAvailableToReadTicketByPropertyScope({
            ticketOrganizationId: ticket.organization,
            ticketPropertyId: ticket.property,
            ticketExecutorId: ticket.executor,
            ticketAssigneeId: ticket.executor,
            ticketCategoryClassifierId: ticket.categoryClassifier,
        })
        const usersWithoutCommentAuthor = users.filter(userId => userId !== createdComment.user)

        for (const employeeUserId of usersWithoutCommentAuthor) {
            await sendMessage(context, {
                lang,
                to: { user: { id: employeeUserId } },
                type: TICKET_COMMENT_CREATED_TYPE,
                meta: {
                    dv: 1,
                    data: {
                        organizationId: organization.id,
                        organizationName: organization.name,
                        commentId,
                        commentContent: createdComment.content || EMPTY_CONTENT,
                        commentType: createdComment.type,
                        commentTypeMessage: CommentTypeMessage,
                        commentCreatedAt: dayjs(createdComment.createdAt).format('YYYY-MM-DD HH:mm'),
                        ticketId,
                        ticketDetails: ticket.details,
                        ticketClassifier,
                        ticketNumber: ticket.number,
                        ticketStatus: TicketStatusName,
                        ticketAddress: ticket.propertyAddress,
                        ticketUnit: ticket.unitName ? `${TicketUnitType} ${ticket.unitName}` : EMPTY_CONTENT,
                        userId: employeeUserId,
                        url: ticketUrl,
                    },
                    telegramMeta: {
                        inlineKeyboard: [[{ text: OpenTicketMessage, url: ticketUrl }]],
                    },
                },
                sender: { dv: 1, fingerprint: 'send-notifications' },
                organization: { id: organization.id },
            })
        }
    } catch (error) {
        taskLogger.error({
            msg: 'Failed to send notifications about created comment on ticket',
            data: { taskId, commentId, ticketId },
            error,
        })
    }
}

module.exports = {
    sendTicketCommentCreatedNotifications,
}