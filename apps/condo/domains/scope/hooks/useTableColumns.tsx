import { useIntl } from '@condo/next/intl'
import get from 'lodash/get'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo } from 'react'
import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getManyEmployeesNameRender } from '@condo/domains/organization/utils/clientSchema/Renders'
import {
    geOneAddressAndPropertiesCountRender,
    getManyPropertiesAddressRender,
} from '@condo/domains/property/utils/clientSchema/Renders'
import { IFilters } from '@condo/domains/ticket/utils/helpers'
import { PropertyScopeOrganizationEmployee, PropertyScopeProperty, SpecializationScope } from '../utils/clientSchema'

export function usePropertyScopeColumns (filterMetas, propertyScopes) {
    const intl = useIntl()
    const PropertyScopeNameMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.propertyScopeName' })
    const PropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.properties' })
    const EmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.employees' })
    const AllPropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.allProperties' })
    const AllEmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.allEmployees' })

    const propertyScopeIds = useMemo(() => propertyScopes.map(propertyScope => propertyScope.id), [propertyScopes])

    const {
        objs: propertyScopeProperties,
        count: propertiesCount,
        fetchMore: fetchMoreProperties,
        loading: propertiesLoading,
    } = PropertyScopeProperty.useObjects({
        where: {
            propertyScope: { id_in: propertyScopeIds, deletedAt: null },
            deletedAt: null,
        },
    })

    const {
        objs: propertyScopeEmployees,
        count: employeesCount,
        fetchMore: fetchMoreEmployees,
        loading: employeesLoading,
    } = PropertyScopeOrganizationEmployee.useObjects({
        where: {
            propertyScope: { id_in: propertyScopeIds },
        },
    })

    const propertyScopesEmployeeIds = uniq(propertyScopeEmployees.map(scope => scope.employee.id))

    const {
        objs: specializationScopes,
        count: specializationScopesCount,
        loading: specializationScopesLoading,
    } = SpecializationScope.useObjects({
        where: {
            employee: { id_in: propertyScopesEmployeeIds },
        },
    })

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')

    const render = useMemo(() => getTableCellRenderer(search), [search])

    const renderPropertyScopeProperties = useCallback((intl, propertyScope) => {
        if (get(propertyScope, 'hasAllProperties')) {
            return AllPropertiesMessage
        }

        const properties = propertyScopeProperties
            .filter(propertyScopeProperty => propertyScopeProperty.propertyScope.id === propertyScope.id)
            .map(propertyScopeProperty => propertyScopeProperty.property)

        return geOneAddressAndPropertiesCountRender(search)(intl, properties)
    }, [AllPropertiesMessage, propertyScopeProperties, search])

    const renderPropertyScopeEmployees = useCallback((intl, propertyScope) => {
        if (get(propertyScope, 'hasAllEmployees')) {
            return AllEmployeesMessage
        }

        const employees = propertyScopeEmployees
            .filter(propertyScopeEmployee => propertyScopeEmployee.propertyScope.id === propertyScope.id)
            .map(propertyScopeEmployee => propertyScopeEmployee.employee)

        return getManyEmployeesNameRender(search)(intl, employees, specializationScopes)
    }, [propertyScopeEmployees, search, specializationScopes])

    return useMemo(() => ({
        loading: propertiesLoading || employeesLoading,
        columns:[
            {
                title: PropertyScopeNameMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                width: '35%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                filterIcon: getFilterIcon,
                render: (name) => render(intl.formatMessage({ id: name }) || name),
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
                key: 'employees',
                render: (_, employeeScope) => renderPropertyScopeEmployees(intl, employeeScope),
                width: '30%',
            },
        ],
    }), [EmployeesMessage, PropertiesMessage, PropertyScopeNameMessage, employeesLoading, filterMetas, filters,
        intl, propertiesLoading, render, renderPropertyScopeEmployees, renderPropertyScopeProperties])
}