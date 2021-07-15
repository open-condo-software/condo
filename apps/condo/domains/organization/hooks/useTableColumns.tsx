import { identity } from 'lodash/util'
import { Checkbox, Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import React, { useMemo } from 'react'
import { colors } from '@condo/domains/common/constants/style'
import { createSorterMap, IFilters } from '../utils/helpers'
import { OrganizationEmployeeRole } from '../utils/clientSchema'
import { getTextFilterDropdown, getFilterIcon, FilterContainer } from '@condo/domains/common/components/TableFilter'
import { isEmpty } from 'lodash'
import { Highliter } from '../../common/components/Highliter'
import { EmptyTableCell } from '@condo/domains/common/components/EmptyTableCell'

const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

export const useTableColumns = (organizationId: string, sort: Array<string>, filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const PhoneMessage =  intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })

    const sorterMap = createSorterMap(sort)
    const { loading, objs: organizationEmployeeRoles } = OrganizationEmployeeRole.useObjects({ where: { organization: { id: organizationId } } })
    const search = getFilteredValue(filters, 'search')
    const render = (text) => {
        let result = text
        if (!isEmpty(search) && text) {
            result = (
                <Highliter
                    text={String(text)}
                    search={String(search)}
                    renderPart={(part) => (
                        <Typography.Text style={{ backgroundColor: colors.markColor }}>
                            {part}
                        </Typography.Text>
                    )}
                />
            )
        }
        return (<EmptyTableCell>{result}</EmptyTableCell>)
    }
    const columns = useMemo(() => {
        return [
            {
                title: NameMessage,
                sortOrder: get(sorterMap, 'name'),
                filteredValue: getFilteredValue(filters, 'name'),
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
                filteredValue: getFilteredValue(filters, 'position'),
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
                filteredValue: getFilteredValue(filters, 'role'),
                dataIndex: 'role',
                key: 'role',
                sorter: true,
                width: '20%',
                render: (role) => render(get(role, 'name')),
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    const adaptedStatuses = organizationEmployeeRoles.map(OrganizationEmployeeRole.convertGQLItemToFormSelectState).filter(identity)

                    return (
                        <FilterContainer
                            clearFilters={clearFilters}
                            showClearButton={selectedKeys && selectedKeys.length > 0}
                        >
                            <Checkbox.Group
                                disabled={loading}
                                options={adaptedStatuses}
                                style={{ display: 'flex', flexDirection: 'column' }}
                                value={selectedKeys}
                                onChange={(e) => {
                                    setFiltersApplied(true)
                                    setSelectedKeys(e)
                                    confirm({ closeDropdown: false })
                                }}
                            />
                        </FilterContainer>
                    )
                },
                filterIcon: getFilterIcon,
            },
            {
                title: PhoneMessage,
                sortOrder: get(sorterMap, 'phone'),
                filteredValue: getFilteredValue(filters, 'phone'),
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
                filteredValue: getFilteredValue(filters, 'email'),
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
