const dayjs = require('dayjs')
const { isEmpty, get, isNumber } = require('lodash')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { MAX_COUNT_COMPLETED_TICKET_TO_CLOSE_FOR_ORGANIZATION_TASK } = require('@condo/domains/common/constants/featureflags')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

const CHUNK_SIZE = 50
const ERROR_START_TICKET_CLOSING = 'failed to start ticket closing because the limit was less than one or was not a number'

const taskLogger = getLogger()

/**
 * Closes tickets that are in the "completed" status for 7 days
 */
const closeCompletedTickets = async (defaultLimit = 100) => {
    const { keystone } = await getSchemaCtx('Ticket')
    const context = await keystone.createContext()

    // NOTE Mobile apps can take a long time to download a large number of updated tickets.
    // Therefore, you should limit updating tickets for each organization at one time if there are a lot of them.
    // With the help of the feature flag, you can manage this restriction.
    const limitByOrganization = await featureToggleManager.getFeatureValue(
        null, MAX_COUNT_COMPLETED_TICKET_TO_CLOSE_FOR_ORGANIZATION_TASK, defaultLimit
    )

    if (!isNumber(limitByOrganization) || limitByOrganization < 1) {
        taskLogger.error({
            msg: ERROR_START_TICKET_CLOSING,
            data: { limit: limitByOrganization },
        })
        throw new Error(ERROR_START_TICKET_CLOSING)
    }

    const weekAgo = dayjs().subtract('7', 'days').toISOString()
    const ticketWhere = {
        status: { id: STATUS_IDS.COMPLETED },
        statusUpdatedAt_lte: weekAgo,
        deletedAt: null,
    }

    const countTicketToChange = await Ticket.count(context, ticketWhere)
    const countChangedTicketByOrganization = {}
    let changedTicketCounter = 0
    let skippedTicket = 0

    while (countTicketToChange > changedTicketCounter) {
        const ticketsToChange = await Ticket.getAll(context,
            ticketWhere,
            'id organization { id }',
            {
                first: CHUNK_SIZE,
                // NOTE The list needs to be sorted in the same order all the time.
                // This is necessary so that we can skip the required number of elements without allowing repetitions
                sortBy: ['createdAt_ASC', 'createdBy_ASC'],
                // NOTE It is necessary to skip tickets that could not be updated
                // or were skipped in order to avoid looping on the same elements
                skip: skippedTicket,
            })

        if (isEmpty(ticketsToChange)) break

        changedTicketCounter += ticketsToChange.length

        for (const ticket of ticketsToChange) {
            const organizationId = get(ticket, 'organization.id', null)
            if (countChangedTicketByOrganization[organizationId] && countChangedTicketByOrganization[organizationId] >= limitByOrganization) {
                skippedTicket += 1
                continue
            }

            try {
                const updatedData = {
                    dv: 1,
                    sender: { fingerprint: 'auto-close', dv: 1 },
                    status: { connect: { id: STATUS_IDS.CLOSED } },
                }

                await Ticket.update(context, ticket.id, updatedData)

                if (organizationId in countChangedTicketByOrganization) {
                    countChangedTicketByOrganization[organizationId] += 1
                } else {
                    countChangedTicketByOrganization[organizationId] = 1
                }
            } catch (err) {
                skippedTicket += 1
                taskLogger.error({
                    msg: 'failed to close Ticket',
                    data: { id: ticket.id },
                    err,
                })
            }
        }
    }
}

module.exports = {
    closeCompletedTicketsCron: createCronTask('closeCompletedTickets', '0 1 * * *', closeCompletedTickets),
    closeCompletedTickets,
    ERROR_START_TICKET_CLOSING,
}
