import { useIntl } from '@condo/next/intl'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getManyEmployeesNameRender } from '@condo/domains/organization/utils/clientSchema/Renders'
import { getManyPropertiesAddressRender } from '@condo/domains/property/utils/clientSchema/Renders'
import { IFilters } from '@condo/domains/ticket/utils/helpers'
import { PropertyScopeOrganizationEmployee, PropertyScopeProperty } from '../utils/clientSchema'

export function usePropertyScopeColumns (filterMetas, propertyScopes) {
    const intl = useIntl()
    const PropertyScopeNameMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.propertyScopeName' })
    const PropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.properties' })
    const EmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.employees' })

    const propertyScopeIds = propertyScopes.map(propertyScope => propertyScope.id)
    const { objs: propertyScopeProperties } = PropertyScopeProperty.useObjects({
        where: {
            propertyScope: { id_in: propertyScopeIds },
        },
    })
    const { objs: propertyScopeEmployees } = PropertyScopeOrganizationEmployee.useObjects({
        where: {
            propertyScope: { id_in: propertyScopeIds },
        },
    })

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')

    const render = useMemo(() => getTableCellRenderer(search), [search])

    const renderPropertyScopeProperties = useCallback((intl, propertyScope) => {
        const properties = propertyScopeProperties
            .filter(propertyScopeProperty => propertyScopeProperty.propertyScope.id === propertyScope.id)
            .map(propertyScopeProperty => propertyScopeProperty.property)

        return getManyPropertiesAddressRender(search)(intl, properties)
    }, [propertyScopeProperties, search])

    const renderPropertyScopeEmployees = useCallback((intl, propertyScope) => {
        const employees = propertyScopeEmployees
            .filter(propertyScopeEmployee => propertyScopeEmployee.propertyScope.id === propertyScope.id)
            .map(propertyScopeEmployee => propertyScopeEmployee.employee.name)

        return getManyEmployeesNameRender(search)(intl, employees)
    }, [propertyScopeEmployees, search])

    return useMemo(() => [
        {
            title: PropertyScopeNameMessage,
            filteredValue: getFilteredValue<IFilters>(filters, 'name'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            width: '20%',
            filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
            filterIcon: getFilterIcon,
            render,
        },
        {
            title: PropertiesMessage,
            ellipsis: true,
            key: 'properties',
            render: (_, propertyScope) => renderPropertyScopeProperties(intl, propertyScope),
            width: '35%',
        },
        {
            title: EmployeesMessage,
            key: 'properties',
            render: (_, propertyScope) => renderPropertyScopeEmployees(intl, propertyScope),
            width: '35%',
        },
    ], [EmployeesMessage, PropertiesMessage, PropertyScopeNameMessage, filterMetas, filters, intl, render, renderPropertyScopeEmployees, renderPropertyScopeProperties])
}