import React, { CSSProperties, useMemo } from 'react'
import { identity } from 'lodash/util'
import get from 'lodash/get'
import { Checkbox } from 'antd'

import { useIntl } from '@core/next/intl'

import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getTextFilterDropdown, getFilterIcon, FilterContainer } from '@condo/domains/common/components/TableFilter'
import { getTableCellRenderer, renderCellWithHighlightedContents } from '@condo/domains/common/components/Table/Renders'

import { createSorterMap, IFilters } from '../utils/helpers'
import { OrganizationEmployeeRole } from '../utils/clientSchema'
import { getOptionFilterDropdown } from '../../common/components/Table/Filters'

const FILTER_DROPDOWN_CHECKBOX_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column' }

export const useTableColumns = (
    organizationId: string,
    sort: Array<string>,
    filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const PhoneMessage =  intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })

    const sorterMap = createSorterMap(sort)
    const { loading, objs: organizationEmployeeRoles } = OrganizationEmployeeRole.useNewObjects({ where: { organization: { id: organizationId } } })
    const search = getFilteredValue<IFilters>(filters, 'search')

    const render = getTableCellRenderer(search)

    const renderCheckboxFilterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const adaptedStatuses = organizationEmployeeRoles.map(OrganizationEmployeeRole.convertGQLItemToFormSelectState).filter(identity)
        const filterProps = {
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
            beforeChange: () => { setFiltersApplied(true) },
        }

        return getOptionFilterDropdown(adaptedStatuses, loading)(filterProps)
    }

    const columns = useMemo(() => {
        return [
            {
                title: NameMessage,
                sortOrder: get(sorterMap, 'name'),
                filteredValue: getFilteredValue<IFilters>(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                filterDropdown: getTextFilterDropdown(NameMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
            {
                title: PositionMessage,
                sortOrder: get(sorterMap, 'position'),
                filteredValue: getFilteredValue<IFilters>(filters, 'position'),
                dataIndex: 'position',
                key: 'position',
                width: '15%',
                render,
                filterDropdown: getTextFilterDropdown(PositionMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
            },
            {
                title: RoleMessage,
                sortOrder: get(sorterMap, 'role'),
                filteredValue: getFilteredValue<IFilters>(filters, 'role'),
                dataIndex: 'role',
                key: 'role',
                sorter: true,
                width: '15%',
                render: (role) => render(get(role, 'name')),
                filterDropdown: renderCheckboxFilterDropdown,
                filterIcon: getFilterIcon,
            },
            {
                title: PhoneMessage,
                sortOrder: get(sorterMap, 'phone'),
                filteredValue: getFilteredValue<IFilters>(filters, 'phone'),
                dataIndex: 'phone',
                key: 'phone',
                sorter: true,
                width: '15%',
                filterDropdown: getTextFilterDropdown(PhoneMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
            {
                title: EmailMessage,
                ellipsis: true,
                dataIndex: 'email',
                filteredValue: getFilteredValue<IFilters>(filters, 'email'),
                key: 'email',
                width: '20%',
                filterDropdown: getTextFilterDropdown(EmailMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
        ]
    }, [sort, filters])

    return columns
}
