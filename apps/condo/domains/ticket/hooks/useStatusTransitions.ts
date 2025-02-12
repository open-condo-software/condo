import { useGetTicketStatusesQuery } from '@app/condo/gql'
import { Organization, OrganizationEmployee } from '@app/condo/schema'

// import { TicketStatus } from '../utils/clientSchema'
import { useCachePersistor } from '@open-condo/apollo'

import { getPossibleStatuses } from '../utils/status'

export const useStatusTransitions = (ticketStatusId: string, organization: Organization, employee: OrganizationEmployee) => {
    // const { objs: statusList, loading } = TicketStatus.useObjects({})
    // console.log('statusList', statusList)

    const { persistor } = useCachePersistor()

    const {
        data,
        loading,
    } = useGetTicketStatusesQuery({
        skip: !persistor,
    })
    // console.log('data', data)
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