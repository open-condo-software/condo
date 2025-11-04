const dayjs = require('dayjs')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { getById, getByCondition, getSchemaCtx } = require('@open-condo/keystone/schema')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { SMS_AFTER_TICKET_CREATION } = require('@condo/domains/common/constants/featureflags')
const { TWO_OR_MORE_SPACES_REGEXP } = require('@condo/domains/common/constants/regexps')
const { md5 } = require('@condo/domains/common/utils/crypto')
const { TICKET_ASSIGNEE_CONNECTED_TYPE, TICKET_EXECUTOR_CONNECTED_TYPE,
    TICKET_STATUS_RETURNED_TYPE,
    TICKET_STATUS_OPENED_TYPE,
    TICKET_STATUS_IN_PROGRESS_TYPE,
    TICKET_STATUS_COMPLETED_TYPE,
    TICKET_STATUS_DECLINED_TYPE, TRACK_TICKET_IN_DOMA_APP_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { ORGANIZATION_NAME_PREFIX_AND_QUOTES_REGEXP } = require('@condo/domains/organization/constants/common')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { detectTicketEventTypes, TICKET_CREATED, ASSIGNEE_CONNECTED_EVENT_TYPE, EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE, TICKET_WITHOUT_RESIDENT_CREATED_EVENT_TYPE,
} = require('@condo/domains/ticket/utils/detectTicketEventTypes')

const { sendTicketCreatedNotifications } = require('./sendTicketCreatedNotifications')


const taskLogger = getLogger()


const sendTicketChangedNotifications = async ({ ticketId, existingItem, operation }) => {
    try {
        taskLogger.info({
            msg: 'start of sending ticket changed notifications',
            entityId: ticketId,
            entity: 'Ticket',
            data: { operation },
        })

        if (!ticketId) throw new Error('no ticketId!')
        if (!operation) throw new Error('no operation!')

        const { keystone: context } = getSchemaCtx('Ticket')
        const updatedItem = await getById('Ticket', ticketId)

        const eventTypes = detectTicketEventTypes({ operation, existingItem, updatedItem })

        const isCreateOperation =  operation === 'create'
        const prevAssigneeId = !isCreateOperation && get(existingItem, 'assignee')
        const prevExecutorId = !isCreateOperation && get(existingItem, 'executor')
        const prevStatusId = get(existingItem, 'status')
        const nextAssigneeId = get(updatedItem, 'assignee')
        const nextExecutorId = get(updatedItem, 'executor')
        const nextStatusId = get(updatedItem, 'status')
        const clientId = get(updatedItem, 'client')
        const clientPhone = get(updatedItem, 'clientPhone')
        const statusReopenedCounter = get(updatedItem, 'statusReopenedCounter')
        const createdBy = get(updatedItem, 'createdBy')
        const updatedBy = get(updatedItem, 'updatedBy')
        const canReadByResident = get(updatedItem, 'canReadByResident') || get(existingItem, 'canReadByResident')

        // TODO(DOMA-2822): get rid of this extra request by returning country within nested organization data
        const organization = await getByCondition('Organization', {
            id: updatedItem.organization,
            deletedAt: null,
        })

        /**
         * Detect message language
         * Use DEFAULT_LOCALE if organization.country is unknown
         * (not defined within @condo/domains/common/constants/countries)
         */
        const organizationCountry = get(organization, 'country', conf.DEFAULT_LOCALE)
        // TODO(DOMA-11040): get locale for sendMessage from user
        const lang = get(COUNTRIES, [organizationCountry, 'locale'], conf.DEFAULT_LOCALE)

        if (eventTypes[TICKET_CREATED]) {
            try {
                await sendTicketCreatedNotifications.delay(updatedItem.id, lang, organization.id, organization.name)
            } catch (err) {
                taskLogger.error({
                    msg: 'failed to send notifications by "TICKET_CREATED" event',
                    err,
                    entityId: ticketId,
                    entity: 'Ticket',
                    data: { operation },
                })
            }
        }

        if (eventTypes[ASSIGNEE_CONNECTED_EVENT_TYPE]) {
            const userId = nextAssigneeId || prevAssigneeId

            try {
                await sendMessage(context, {
                    lang,
                    to: { user: { id: userId } },
                    type: TICKET_ASSIGNEE_CONNECTED_TYPE,
                    meta: {
                        dv: 1,
                        data: {
                            ticketId: updatedItem.id,
                            ticketNumber: updatedItem.number,
                            userId,
                            url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                            organizationId: organization.id,
                        },
                    },
                    sender: updatedItem.sender,
                    organization: { id: organization.id },
                })
            } catch (err) {
                taskLogger.error({
                    msg: 'failed to send notifications by "ASSIGNEE_CONNECTED" event',
                    err,
                    entityId: ticketId,
                    entity: 'Ticket',
                    data: { operation, userId },
                })
            }
        }

        if (eventTypes[EXECUTOR_CONNECTED_EVENT_TYPE]) {
            const userId = nextExecutorId || prevExecutorId

            try {
                await sendMessage(context, {
                    lang,
                    to: { user: { id: userId } },
                    type: TICKET_EXECUTOR_CONNECTED_TYPE,
                    meta: {
                        dv: 1,
                        data: {
                            ticketId: updatedItem.id,
                            ticketNumber: updatedItem.number,
                            userId,
                            url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                            organizationId: organization.id,
                        },
                    },
                    sender: updatedItem.sender,
                    organization: { id: organization.id },
                })
            } catch (err) {
                taskLogger.error({
                    msg: 'failed to send notifications by "EXECUTOR_CONNECTED" event',
                    err,
                    entityId: ticketId,
                    entity: 'Ticket',
                    data: { operation, userId },
                })
            }
        }

        if (eventTypes[STATUS_CHANGED_EVENT_TYPE] && canReadByResident) {
            try {
                let ticketStatusType

                switch (nextStatusId) {
                    case STATUS_IDS.OPEN:
                        if (prevStatusId !== STATUS_IDS.COMPLETED && !isCreateOperation)
                            break

                        if (statusReopenedCounter > 0)
                            ticketStatusType = updatedBy !== clientId && TICKET_STATUS_RETURNED_TYPE
                        else
                            ticketStatusType = createdBy !== clientId && TICKET_STATUS_OPENED_TYPE
                        break

                    case STATUS_IDS.IN_PROGRESS:
                        ticketStatusType = TICKET_STATUS_IN_PROGRESS_TYPE
                        break

                    case STATUS_IDS.COMPLETED:
                        ticketStatusType = TICKET_STATUS_COMPLETED_TYPE
                        break

                    case STATUS_IDS.DECLINED:
                        ticketStatusType = TICKET_STATUS_DECLINED_TYPE
                        break
                }

                if (ticketStatusType) {
                    const { property: propertyId, organization: organizationId, unitName, unitType } = updatedItem
                    const where = {
                        user: { id: clientId, deletedAt: null },
                        property: { id: propertyId, deletedAt: null },
                        organization: { id: organizationId, deletedAt: null },
                        unitName,
                        unitType,
                        deletedAt: null,
                    }
                    const resident = await Resident.getOne(context, where)

                    await sendMessage(context, {
                        lang,
                        to: { user: { id: clientId } },
                        type: ticketStatusType,
                        meta: {
                            dv: 1,
                            data: {
                                ticketId: updatedItem.id,
                                ticketNumber: updatedItem.number,
                                userId: clientId,
                                url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                                residentId: get(resident, 'id', null),
                            },
                        },
                        sender: updatedItem.sender,
                        organization: { id: organization.id },
                    })
                }
            } catch (err) {
                taskLogger.error({
                    msg: 'failed to send notifications by "STATUS_CHANGED" event',
                    err,
                    entityId: ticketId,
                    entity: 'Ticket',
                    data: { operation },
                })
            }
        }

        if (eventTypes[TICKET_WITHOUT_RESIDENT_CREATED_EVENT_TYPE] && clientPhone) {
            try {
                const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(
                    context,
                    SMS_AFTER_TICKET_CREATION,
                    { organization: organization.id }
                )

                if (conf.USE_LOCAL_FEATURE_FLAGS || isFeatureEnabled) {
                    const today = dayjs().format('YYYY-MM-DD')
                    const uniqKey = `${today}_${md5(clientPhone)}`
                    const ticketOrganizationName = get(organization, 'name', '')
                        .replace(ORGANIZATION_NAME_PREFIX_AND_QUOTES_REGEXP, ' ')
                        .trim()
                        .replace(TWO_OR_MORE_SPACES_REGEXP, ' ')

                    await sendMessage(context, {
                        lang,
                        to: { phone: clientPhone },
                        type: TRACK_TICKET_IN_DOMA_APP_TYPE,
                        uniqKey,
                        meta: {
                            dv: 1,
                            data: {
                                organization: ticketOrganizationName,
                            },
                        },
                        sender: updatedItem.sender,
                        organization: { id: organization.id },
                    })
                }
            } catch (err) {
                taskLogger.error({
                    msg: 'failed to send notifications by "TICKET_WITHOUT_RESIDENT_CREATED" event',
                    err,
                    entityId: ticketId,
                    entity: 'Ticket',
                    data: { operation },
                })
            }
        }

        taskLogger.info({
            msg: 'successful sending ticket changed notifications',
            entityId: ticketId,
            entity: 'Ticket',
            data: { operation },
        })
    } catch (err) {
        taskLogger.error({
            msg: 'sendTicketChangedNotifications internal error',
            err,
            entityId: ticketId,
            entity: 'Ticket',
            data: { operation },
        })
        throw err
    }
}

module.exports = {
    sendTicketChangedNotifications,
}
