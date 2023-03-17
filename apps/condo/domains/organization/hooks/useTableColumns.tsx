import { Organization } from '@app/condo/schema'
import { Typography } from 'antd'
import { ColumnType } from 'antd/lib/table/interface'
import get from 'lodash/get'
import { identity } from 'lodash/util'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getOptionFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import { getEmployeeSpecializationsMessage, renderPhone } from '@condo/domains/organization/utils/clientSchema/Renders'
import { IFilters } from '@condo/domains/organization/utils/helpers'


const TEXT_STYLES = { margin: 0 }

export const useTableColumns = (
    filterMetas,
    organizationId: string,
    employees
) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const PhoneMessage =  intl.formatMessage({ id: 'Phone' })
    const SpecializationsMessage = intl.formatMessage({ id: 'employee.Specializations' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')

    const render = useMemo(() => getTableCellRenderer({ search }), [search])

    const { objs: organizationEmployeeSpecializations } = OrganizationEmployeeSpecialization.useObjects({
        where: {
            employee: { id_in: employees.map(employee => employee.id) },
        },
    })

    const { loading, objs: organizationEmployeeRoles } = OrganizationEmployeeRole.useObjects({ where: { organization: { id: organizationId } } })

    const renderCheckboxFilterDropdown: ColumnType<Organization>['filterDropdown'] = useCallback((filterProps) => {
        const adaptedStatuses = organizationEmployeeRoles.map(OrganizationEmployeeRole.convertGQLItemToFormSelectState).filter(identity)
        return getOptionFilterDropdown({ checkboxGroupProps: { options: adaptedStatuses, disabled: loading } })(filterProps)
    }, [loading, organizationEmployeeRoles])

    const renderSpecializations = useCallback((employee) => {
        const { SpecializationsMessage } = getEmployeeSpecializationsMessage(intl, employee, organizationEmployeeSpecializations)

        return (
            <Typography.Paragraph key={employee.id} style={TEXT_STYLES}>
                {SpecializationsMessage && SpecializationsMessage}
            </Typography.Paragraph>
        )
    }, [intl, organizationEmployeeSpecializations])

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
                render,
                width: '15%',
            },
            {
                title: RoleMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'role'),
                dataIndex: 'role',
                key: 'role',
                sorter: true,
                width: '10%',
                render: (role) => render(get(role, 'name')),
                filterDropdown: renderCheckboxFilterDropdown,
                filterIcon: getFilterIcon,
            },
            {
                title: PositionMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'position'),
                dataIndex: 'position',
                key: 'position',
                width: '10%',
                render,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'position'),
                filterIcon: getFilterIcon,
            },
            {
                title: SpecializationsMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'specialization'),
                width: '20%',
                render: (_, employee) => renderSpecializations(employee),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'specialization'),
                filterIcon: getFilterIcon,
            },
            {
                title: PhoneMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'phone'),
                dataIndex: 'phone',
                key: 'phone',
                sorter: true,
                width: '15%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'phone'),
                filterIcon: getFilterIcon,
                render: renderPhone,
            },
        ]
    }, [NameMessage, PhoneMessage, PositionMessage, RoleMessage, SpecializationsMessage, filterMetas, filters, render, renderCheckboxFilterDropdown, renderSpecializations])
}
