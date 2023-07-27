import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/contact/utils/helpers'

import {
    ASSIGNED_TICKET_VISIBILITY,
    ORGANIZATION_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
    PROPERTY_TICKET_VISIBILITY,
} from '../constants/common'

export function useEmployeeRolesTableColumns<T> (filterMetas: Array<FiltersMeta<T>>): Array<Record<string, unknown>> {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.role' })
    const AvailableTicketsMessage = intl.formatMessage({ id: 'employeeRoles.availableTickets' })
    const AllTicketsMessage = intl.formatMessage({ id: 'employeeRoles.availableTickets.allTickets' })
    const TicketsBySelectedPropertiesMessage = intl.formatMessage({ id: 'employeeRoles.availableTickets.bySelectedProperties' })
    const TicketsBySelectedPropertiesAndSpecializationsMessage = intl.formatMessage({ id: 'employeeRoles.availableTickets.bySelectedPropertiesAndSpecializations' })
    const AssignedTicketsMessage = intl.formatMessage({ id: 'employeeRoles.availableTickets.assignedTickets' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)

    const renderAvailableTicketsByRoleMessage = useCallback((_, role) => {
        const ticketVisibilityType = get(role, 'ticketVisibilityType')

        switch (ticketVisibilityType) {
            case ORGANIZATION_TICKET_VISIBILITY: {
                return AllTicketsMessage
            }
            case PROPERTY_TICKET_VISIBILITY: {
                return `${TicketsBySelectedPropertiesMessage} + ${AssignedTicketsMessage}`
            }
            case PROPERTY_AND_SPECIALIZATION_VISIBILITY: {
                return `${TicketsBySelectedPropertiesAndSpecializationsMessage} + ${AssignedTicketsMessage}`
            }
            case ASSIGNED_TICKET_VISIBILITY: {
                return AssignedTicketsMessage
            }

            default: {
                return '—'
            }
        }
    }, [AllTicketsMessage, AssignedTicketsMessage, TicketsBySelectedPropertiesAndSpecializationsMessage, TicketsBySelectedPropertiesMessage])

    return useMemo(() => {
        return [
            {
                title: NameMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                filterIcon: getFilterIcon,
                ellipsis: true,
                width: '35%',
            },
            {
                title: AvailableTicketsMessage,
                key: 'description',
                render: renderAvailableTicketsByRoleMessage,
            },
        ]
    }, [NameMessage, filters, filterMetas, AvailableTicketsMessage, renderAvailableTicketsByRoleMessage])
}
