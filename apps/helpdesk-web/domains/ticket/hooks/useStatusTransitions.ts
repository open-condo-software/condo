import { useGetTicketStatusesQuery } from '@app/condo/gql'
import { Organization, OrganizationEmployee } from '@app/condo/schema'

import { useCachePersistor } from '@open-condo/apollo'

import { getPossibleStatuses } from '../utils/status'

export const useStatusTransitions = (ticketStatusId: string, organization: Organization, employee: OrganizationEmployee) => {
    const { persistor } = useCachePersistor()

    const {
        data: ticketStatusesData,
        loading: ticketStatusesLoading,
    } = useGetTicketStatusesQuery({
        skip: !persistor,
    })
    const statusList = ticketStatusesData?.statuses.filter(Boolean) || []

    const organizationStatusTransition = organization?.statusTransitions || null
    const employeeRoleStatusTransitions = employee?.role?.statusTransitions || null

    return {
        loading: ticketStatusesLoading,
        statuses:  getPossibleStatuses(
            statusList,
            ticketStatusId,
            organizationStatusTransition,
            employeeRoleStatusTransitions,
        ),
    }
}