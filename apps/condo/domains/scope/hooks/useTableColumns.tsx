import get from 'lodash/get'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import { getManyEmployeesNameRender } from '@condo/domains/organization/utils/clientSchema/Renders'
import {
    getOneAddressAndPropertiesCountRender,
} from '@condo/domains/property/utils/clientSchema/Renders'
import { PropertyScopeOrganizationEmployee, PropertyScopeProperty } from '@condo/domains/scope/utils/clientSchema'
import { IFilters } from '@condo/domains/ticket/utils/helpers'

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
        loading: propertiesLoading,
    } = PropertyScopeProperty.useAllObjects({
        where: {
            propertyScope: { id_in: propertyScopeIds, deletedAt: null },
            deletedAt: null,
        },
    })

    const {
        objs: propertyScopeEmployees,
        loading: employeesLoading,
    } = PropertyScopeOrganizationEmployee.useAllObjects({
        where: {
            propertyScope: { id_in: propertyScopeIds },
        },
    })

    const propertyScopesEmployeeIds: string[] = uniq(
        propertyScopeEmployees
            .map(scope => get(scope, ['employee', 'id']))
            .filter(Boolean)
    )

    const {
        objs: organizationEmployeeSpecializations,
        loading: organizationEmployeeSpecializationsLoading,
    } = OrganizationEmployeeSpecialization.useAllObjects({
        where: {
            employee: { id_in: propertyScopesEmployeeIds },
        },
    })

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')

    const render = useMemo(() => getTableCellRenderer({ search }), [search])

    const renderPropertyScopeProperties = useCallback((intl, propertyScope) => {
        if (get(propertyScope, 'hasAllProperties')) {
            return AllPropertiesMessage
        }

        const properties = propertyScopeProperties
            .filter(propertyScopeProperty => propertyScopeProperty.propertyScope.id === propertyScope.id)
            .map(propertyScopeProperty => propertyScopeProperty.property)

        return getOneAddressAndPropertiesCountRender(search)(intl, properties)
    }, [AllPropertiesMessage, propertyScopeProperties, search])

    const renderPropertyScopeEmployees = useCallback((intl, propertyScope) => {
        if (get(propertyScope, 'hasAllEmployees')) {
            return AllEmployeesMessage
        }

        const employees = propertyScopeEmployees
            .filter(propertyScopeEmployee => propertyScopeEmployee.propertyScope.id === propertyScope.id)
            .map(propertyScopeEmployee => propertyScopeEmployee.employee)
            .filter(Boolean)

        return getManyEmployeesNameRender()(intl, employees, organizationEmployeeSpecializations)
    }, [AllEmployeesMessage, propertyScopeEmployees, organizationEmployeeSpecializations])

    return useMemo(() => ({
        loading: propertiesLoading || employeesLoading || organizationEmployeeSpecializationsLoading,
        columns:[
            {
                title: PropertyScopeNameMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                width: '33%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                filterIcon: getFilterIcon,
                render,
            },
            {
                title: PropertiesMessage,
                key: 'properties',
                render: (_, propertyScope) => renderPropertyScopeProperties(intl, propertyScope),
                width: '33%',
            },
            {
                title: EmployeesMessage,
                key: 'employees',
                render: (_, employeeScope) => renderPropertyScopeEmployees(intl, employeeScope),
                width: '33%',
            },
        ],
    }), [EmployeesMessage, PropertiesMessage, PropertyScopeNameMessage, employeesLoading, filterMetas, filters, intl, organizationEmployeeSpecializationsLoading, propertiesLoading, render, renderPropertyScopeEmployees, renderPropertyScopeProperties])
}