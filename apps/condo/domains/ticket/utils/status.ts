import { TicketStatus } from '@app/condo/schema'
import get from 'lodash/get'
import intersection from 'lodash/intersection'

export const getPossibleStatuses = (
    statusList: Array<TicketStatus> = [],
    ticketStatusId: string,
    transitionsFromOrganization?: Record<string, Array<string>>,
    transitionsFromEmployeeRole?: Record<string, Array<string>>,
): Array<TicketStatus> => {
    if (!transitionsFromOrganization) {
        return []
    }

    const possibleOrganizationTransitions = get(transitionsFromOrganization, ticketStatusId, [])
    const possibleEmployeeTransitions = get(transitionsFromEmployeeRole, ticketStatusId, [])

    return intersection(possibleOrganizationTransitions, possibleEmployeeTransitions)
        .map((transition) => statusList.find((status) => get(status, 'id') === transition))
        .filter(Boolean)
}
