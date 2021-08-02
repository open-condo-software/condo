// @ts-nocheck
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import { TicketStatus } from '../utils/clientSchema'
import { getPossibleStatuses } from '../utils/status'

// TODO (nomerdvadcatpyat) organizationFromProps, employeeFromProps remove (take up)
export const useStatusTransitions = (ticketStatusId: string, organizationFromProps, employeeFromProps) => {
    const { organization, link: employee } = useOrganization()
    const { objs: statusList, loading } = TicketStatus.useObjects()

    const resOrganizationStatusTransition = get(organizationFromProps, 'statusTransitions') || get(organization, 'statusTransitions')
    const resEmployeeRoleStatusTransitions = get(employeeFromProps, ['role', 'statusTransitions']) || get(employee, ['role', 'statusTransitions'])
    const resOrganizationDefaultEmployeeRoleStatusTransitions = get(organizationFromProps, 'defaultEmployeeRoleStatusTransitions') || get(organization, 'defaultEmployeeRoleStatusTransitions')

    return {
        loading: loading,
        statuses:  getPossibleStatuses(
            statusList,
            ticketStatusId,
            resOrganizationStatusTransition,
            resEmployeeRoleStatusTransitions,
            resOrganizationDefaultEmployeeRoleStatusTransitions
        ),
    }
}