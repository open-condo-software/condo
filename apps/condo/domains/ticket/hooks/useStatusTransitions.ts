import { useGetTicketStatusesQuery } from '@app/condo/gql'
import { Organization, OrganizationEmployee } from '@app/condo/schema'

import { useCachePersistor } from '@open-condo/apollo'

import { getPossibleStatuses } from '../utils/status'

export const useStatusTransitions = (ticketStatusId: string, organization: Organization, employee: OrganizationEmployee) => {
    const { persistor } = useCachePersistor()

    const {
        data,
        loading,
    } = useGetTicketStatusesQuery({
        skip: !persistor,
    })

    const statusList = data?.statuses.filter(Boolean) || []
    const organizationStatusTransition = organization?.statusTransitions || null
    const employeeRoleStatusTransitions = employee?.role?.statusTransitions || null

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