// @ts-nocheck
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import { Organization } from '../../organization/utils/clientSchema'
import { TicketStatus } from '../utils/clientSchema'
import { getPossibleStatuses } from '../utils/status'

export const useStatusTransitions = (ticketStatusId: string) => {
    const { organization, link: employee } = useOrganization()
    const { objs: statusList, loading } = TicketStatus.useObjects()

    return {
        loading: loading,
        statuses:  getPossibleStatuses(
            statusList,
            ticketStatusId,
            get(organization, 'statusTransitions'),
            get(employee, ['role', 'statusTransitions']),  get(organization, 'defaultEmployeeRoleStatusTransitions'),
        )
        ,
    }
}