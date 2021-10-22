import React, { CSSProperties, useMemo } from 'react'
import { identity } from 'lodash/util'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { Checkbox } from 'antd'
import { FilterValue } from 'antd/es/table/interface'

import { useIntl } from '@core/next/intl'

import { MessageSetMeta } from '@condo/domains/common/types'
import { getIntlMessages } from '@condo/domains/common/utils/helpers'
import { getTextFilterDropdown, getFilterIcon, FilterContainer } from '@condo/domains/common/components/TableFilter'
import { renderHighlightedPart } from '@condo/domains/common/components/Table/Renders'
import { EmptyTableCell } from '@condo/domains/common/components/Table/EmptyTableCell'
import { TextHighlighter } from '@condo/domains/common/components/TextHighlighter'


import { createSorterMap, IFilters } from '../utils/helpers'
import { OrganizationEmployeeRole } from '../utils/clientSchema'

const FILTER_DROPDOWN_CHECKBOX_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column' }

const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

type TableMessageKeys = 'NameMessage' | 'RoleMessage' | 'PositionMessage' | 'PhoneMessage' | 'EmailMessage'

const TABLE_MESSAGES: MessageSetMeta<TableMessageKeys> = {
    NameMessage: 'pages.auth.register.field.Name',
    RoleMessage: 'employee.Role',
    PositionMessage: 'employee.Position',
    PhoneMessage: 'Phone',
    EmailMessage: 'field.EMail',
}

export const useTableColumns = (
    organizationId: string,
    sort: Array<string>,
    filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const intl = useIntl()
    const messages = getIntlMessages<TableMessageKeys>(intl, TABLE_MESSAGES)
    const sorterMap = createSorterMap(sort)
    const { loading, objs: organizationEmployeeRoles } = OrganizationEmployeeRole.useObjects({ where: { organization: { id: organizationId } } })
    const search = getFilteredValue(filters, 'search')

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
                title: messages.NameMessage,
                sortOrder: get(sorterMap, 'name'),
                filteredValue: getFilteredValue(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                width: '40%',
                filterDropdown: getTextFilterDropdown(messages.NameMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
            {
                title: messages.PositionMessage,
                sortOrder: get(sorterMap, 'position'),
                filteredValue: getFilteredValue(filters, 'position'),
                dataIndex: 'position',
                key: 'position',
                width: '20%',
                render,
                filterDropdown: getTextFilterDropdown(messages.PositionMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
            },
            {
                title: messages.RoleMessage,
                sortOrder: get(sorterMap, 'role'),
                filteredValue: getFilteredValue(filters, 'role'),
                dataIndex: 'role',
                key: 'role',
                sorter: true,
                width: '20%',
                render: (role) => render(get(role, 'name')),
                filterDropdown: renderFilterDropdown,
                filterIcon: getFilterIcon,
            },
            {
                title: messages.PhoneMessage,
                sortOrder: get(sorterMap, 'phone'),
                filteredValue: getFilteredValue(filters, 'phone'),
                dataIndex: 'phone',
                key: 'phone',
                sorter: true,
                width: '20%',
                filterDropdown: getTextFilterDropdown(messages.PhoneMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
            {
                title: messages.EmailMessage,
                ellipsis: true,
                dataIndex: 'email',
                filteredValue: getFilteredValue(filters, 'email'),
                key: 'email',
                width: '20%',
                filterDropdown: getTextFilterDropdown(messages.EmailMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
        ]
    }, [sort, filters])

    return columns
}
