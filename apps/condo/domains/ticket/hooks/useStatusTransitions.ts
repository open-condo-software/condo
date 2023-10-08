import { Organization, OrganizationEmployee } from '@app/condo/schema'
import get from 'lodash/get'

import { TicketStatus } from '../utils/clientSchema'
import { getPossibleStatuses } from '../utils/status'

export const useStatusTransitions = (ticketStatusId: string, organization: Organization, employee: OrganizationEmployee) => {
    const { objs: statusList, loading } = TicketStatus.useObjects({})

    const organizationStatusTransition = get(organization, 'statusTransitions')
    const employeeRoleStatusTransitions = get(employee, ['role', 'statusTransitions'])

    return {
        loading: loading,
        statuses:  getPossibleStatuses(
            statusList,
            ticketStatusId,
            organizationStatusTransition,
            employeeRoleStatusTransitions,
        ),
    }
}