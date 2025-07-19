import { Organization } from '@app/condo/schema'
import { Typography } from 'antd'
import { ColumnType } from 'antd/lib/table/interface'
import get from 'lodash/get'
import { identity } from 'lodash/util'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { colors } from '@open-condo/ui/colors'

import { getOptionFilterDropdown, getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import { getEmployeeSpecializationsMessage } from '@condo/domains/organization/utils/clientSchema/Renders'
import { IFilters } from '@condo/domains/organization/utils/helpers'
import { EMAIL_TYPE } from '@condo/domains/user/constants/identifiers'


const TEXT_STYLES = { margin: 0 }

const { publicRuntimeConfig: { inviteRequiredFields } } = getConfig()

const isEmailRequired = inviteRequiredFields.includes(EMAIL_TYPE)

export const useTableColumns = (
    filterMetas,
    organizationId: string,
    employees
) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'Email' })
    const SpecializationsMessage = intl.formatMessage({ id: 'employee.Specializations' })
    const BlockedMessage = intl.formatMessage({ id: 'employee.isBlocked' })

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

        if (!SpecializationsMessage) return null

        return (
            <Typography.Paragraph key={employee.id} style={TEXT_STYLES}>
                {SpecializationsMessage}
            </Typography.Paragraph>
        )
    }, [intl, organizationEmployeeSpecializations])

    const renderBlockedEmployee = useCallback((name) => {
        return (
            <>
                {render(name)}
                <Typography.Paragraph style={{ color: colors.red[5] }}>
                    ({BlockedMessage})
                </Typography.Paragraph>
            </>
        )
    }, [BlockedMessage, render])

    const renderPhone = useCallback((phone) => {
        return getTableCellRenderer(
            { search, href: `tel:${phone}` }
        )(phone)
    }, [search])

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
                render: (name, employee) => employee?.isBlocked ? renderBlockedEmployee(name) : render(name),
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
            ...(isEmailRequired ? [{
                title: EmailMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'email'),
                dataIndex: 'email',
                key: 'email',
                sorter: true,
                width: '20%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'email'),
                filterIcon: getFilterIcon,
            }] : []),
        ]
    }, [
        NameMessage, 
        EmailMessage, 
        PhoneMessage, 
        PositionMessage, 
        RoleMessage, 
        SpecializationsMessage, 
        filterMetas, 
        filters, 
        render, 
        renderCheckboxFilterDropdown, 
        renderSpecializations, 
        employees.isBlocked,
    ])
}
