import React, { CSSProperties, useMemo } from 'react'
import { identity } from 'lodash/util'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { Checkbox } from 'antd'

import { useIntl } from '@core/next/intl'

import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getTextFilterDropdown, getFilterIcon, FilterContainer } from '@condo/domains/common/components/TableFilter'
import { EmptyTableCell } from '@condo/domains/common/components/Table/EmptyTableCell'
import { renderHighlightedPart } from '@condo/domains/common/components/Table/Renders'
import { TextHighlighter } from '@condo/domains/common/components/TextHighlighter'

import { createSorterMap, IFilters } from '../utils/helpers'
import { OrganizationEmployeeRole } from '../utils/clientSchema'

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
    const { loading, objs: organizationEmployeeRoles } = OrganizationEmployeeRole.useObjects({ where: { organization: { id: organizationId } } })
    const search = getFilteredValue<IFilters>(filters, 'search')

    const render = (text) => {
        let result = text

        if (!isEmpty(search) && text) {
            result = (
                <TextHighlighter
                    text={String(text)}
                    search={String(search)}
                    renderPart={renderHighlightedPart}
                />
            )
        }

        return (<EmptyTableCell>{result}</EmptyTableCell>)
    }

    const renderFilterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const adaptedStatuses = organizationEmployeeRoles.map(OrganizationEmployeeRole.convertGQLItemToFormSelectState).filter(identity)

        const handleFilterChange = (e) => {
            setFiltersApplied(true)
            setSelectedKeys(e)
            confirm({ closeDropdown: false })
        }

        return (
            <FilterContainer
                clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
            >
                <Checkbox.Group
                    disabled={loading}
                    options={adaptedStatuses}
                    style={FILTER_DROPDOWN_CHECKBOX_STYLES}
                    value={selectedKeys}
                    onChange={handleFilterChange}
                />
            </FilterContainer>
        )
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
                width: '40%',
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
                width: '20%',
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
                width: '20%',
                render: (role) => render(get(role, 'name')),
                filterDropdown: renderFilterDropdown,
                filterIcon: getFilterIcon,
            },
            {
                title: PhoneMessage,
                sortOrder: get(sorterMap, 'phone'),
                filteredValue: getFilteredValue<IFilters>(filters, 'phone'),
                dataIndex: 'phone',
                key: 'phone',
                sorter: true,
                width: '20%',
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
