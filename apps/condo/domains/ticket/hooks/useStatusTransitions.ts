// @ts-nocheck
import get from 'lodash/get'
import { TicketStatus } from '../utils/clientSchema'
import { getPossibleStatuses } from '../utils/status'
import { Organization, OrganizationEmployee } from '@app/condo/schema'

export const useStatusTransitions = (ticketStatusId: string, organization: Organization, employee: OrganizationEmployee) => {
    const { objs: statusList, loading } = TicketStatus.useNewObjects({})

    const organizationStatusTransition = get(organization, 'statusTransitions')
    const employeeRoleStatusTransitions = get(employee, ['role', 'statusTransitions'])
    const organizationDefaultEmployeeRoleStatusTransitions = get(organization, 'defaultEmployeeRoleStatusTransitions')

    return {
        loading: loading,
        statuses:  getPossibleStatuses(
            statusList,
            ticketStatusId,
            organizationStatusTransition,
            employeeRoleStatusTransitions,
            organizationDefaultEmployeeRoleStatusTransitions
        ),
    }
}