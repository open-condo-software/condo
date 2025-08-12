import {
    OrganizationEmployeeRole as IEmployeeRole,
} from '@app/condo/schema'
import { Table } from 'antd'
import { ColumnsType } from 'antd/es/table/interface'
import get from 'lodash/get'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tooltip, Typography } from '@open-condo/ui'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/contact/utils/helpers'
import {
    ASSIGNED_TICKET_VISIBILITY,
    ORGANIZATION_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
    PROPERTY_TICKET_VISIBILITY,
} from '@condo/domains/organization/constants/common'


export const GROUP_NAME_COLUMN_WIDTH = 200
export const ROLE_NAME_COLUMN_WIDTH = 100

export function useEmployeeRolesTableColumns (roles: IEmployeeRole[]): ColumnsType<IEmployeeRole> {
    const intl = useIntl()
    return [
        {
            dataIndex: 'groupName',
            width: GROUP_NAME_COLUMN_WIDTH,
            key: 'groupName',
            onCell: () => ({ colSpan: 1 + roles.length }),
        },
        ...roles.map(role => ({
            title: () => {
                if (!role.isEditable) {
                    return (
                        <Tooltip
                            title={intl.formatMessage({ id: 'pages.condo.employeeRole.tooltip.notEditableRole' }, { role: get(role, 'name') })}
                            placement='bottom'
                        >
                            <span style={{ cursor: 'not-allowed' }}>
                                {role.name}
                            </span>
                        </Tooltip>
                    )
                }

                return (
                    <Link href={`/settings/employeeRole/${role.id}/update`} legacyBehavior>
                        <Typography.Link href={`/settings/employeeRole/${role.id}/update`} size='small'>
                            {role.name}
                        </Typography.Link>
                    </Link>
                )
            },
            key: role.id,
            ellipsis: { showTitle: true },
            onCell: () => ({ colSpan: 0 }),
            width: ROLE_NAME_COLUMN_WIDTH,
        })),
        Table.EXPAND_COLUMN,
    ]
}

export function useEmployeeRoleTicketVisibilityInfoTableColumns<T> (filterMetas: Array<FiltersMeta<T>>): Array<Record<string, unknown>> {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.Role' })
    const AvailableTicketsMessage = intl.formatMessage({ id: 'EmployeeRoles.availableTickets' })
    const AllTicketsMessage = intl.formatMessage({ id: 'EmployeeRoles.availableTickets.allTickets' })
    const TicketsBySelectedPropertiesMessage = intl.formatMessage({ id: 'EmployeeRoles.availableTickets.bySelectedProperties' })
    const TicketsBySelectedPropertiesAndSpecializationsMessage = intl.formatMessage({ id: 'EmployeeRoles.availableTickets.bySelectedPropertiesAndSpecializations' })
    const AssignedTicketsMessage = intl.formatMessage({ id: 'EmployeeRoles.availableTickets.assignedTickets' })

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
