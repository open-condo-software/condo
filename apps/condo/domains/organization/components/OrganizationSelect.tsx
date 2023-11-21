import { Dropdown } from 'antd'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import React, { useCallback, useMemo, CSSProperties } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { ChevronDown, PlusCircle } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Typography  } from '@open-condo/ui'
import type { TypographyTextProps } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { HOLDING_TYPE } from '@condo/domains/organization/constants/common'
import { useCreateOrganizationModalForm } from '@condo/domains/organization/hooks/useCreateOrganizationModalForm'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

import { SBBOLIndicator } from './SBBOLIndicator'

import type { OrganizationEmployee as OrganizationEmployeeType } from '@app/condo/schema'
import type { DropdownProps } from 'antd'

function compareEmployees (lhs: OrganizationEmployeeType, rhs: OrganizationEmployeeType) {
    return get(lhs, ['organization', 'name'], '')
        .toLowerCase()
        .localeCompare(
            get(rhs, ['organization', 'name'], '').toLowerCase()
        )
}

const DROPDOWN_OVERLAY_STYLES: CSSProperties = { maxWidth: 300, width: '100%' }

const ORGANIZATION_EMPLOYEE_WHERE_QUERY = {
    isRejected: false,
    isBlocked: false,
    organization: { type_not: HOLDING_TYPE },
}

export const InlineOrganizationSelect: React.FC = () => {
    const intl = useIntl()
    const AddOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationButtonLabel' })

    const { breakpoints } = useLayoutContext()
    const textSize: TypographyTextProps['size'] = !breakpoints.TABLET_LARGE ? 'small' : 'medium'

    const { user } = useAuth()
    const { link, selectLink, isLoading: organizationLoading } = useOrganization()
    const userId = get(user, 'id', null)

    const { objs: userEmployees, allDataLoaded: employeesLoaded } = OrganizationEmployee.useAllObjects({
        where: {
            user: { id: userId },
            isAccepted: true,
            ...ORGANIZATION_EMPLOYEE_WHERE_QUERY,
        },
    }, { skip: !userId })

    const { count: hasInvites, loading: isInvitesLoading } = OrganizationEmployee.useCount({
        where: {
            user: { id: userId },
            isAccepted: false,
            ...ORGANIZATION_EMPLOYEE_WHERE_QUERY,
        },
    }, { skip: !userId })

    // Note: Filter case where organization was deleted
    const filteredEmployees = uniqBy(userEmployees.filter(employee => employee.organization), employee => employee.organization.id)

    const { setIsVisible: showCreateOrganizationModal, ModalForm: CreateOrganizationModalForm } = useCreateOrganizationModalForm({})

    const showCreateModal = useCallback(() => {
        showCreateOrganizationModal(true)
    }, [showCreateOrganizationModal])

    const selectEmployee = useCallback((id: string) => {
        return function () {
            selectLink({ id })
        }
    }, [selectLink])

    useDeepCompareEffect(() => {
        if (employeesLoaded && !isInvitesLoading && user) {
            // Note: no current organization selected
            if (!link) {
                // But has organizations to select -> select first one
                if (filteredEmployees.length) {
                    selectLink({ id: filteredEmployees[0].id })
                // No organization -> show modal for creation directly
                } else if (!hasInvites) {
                    showCreateModal()
                }
            // Note: organization in cookie, but value is invalid
            } else if (!filteredEmployees.some(employee => employee.id === link.id)) {
                selectLink(null)
            }
        }
    }, [employeesLoaded, user, link, filteredEmployees, selectLink, showCreateModal, isInvitesLoading, hasInvites])

    const menu = useMemo<DropdownProps['menu']>(() => {
        // Note: spread for sort, since it readonly array
        const sortedEmployees = [...filteredEmployees].sort(compareEmployees)

        const items: DropdownProps['menu']['items'] = sortedEmployees.map(employee => ({
            key: employee.id,
            label: (
                <Space direction='horizontal' size={8}>
                    <SBBOLIndicator organization={get(employee, 'organization')} />
                    <Typography.Paragraph ellipsis={{ rows: 2 }} size='medium'>
                        {get(employee, ['organization', 'name'], '')}
                    </Typography.Paragraph>
                </Space>
            ),
            onClick: selectEmployee(employee.id),
        }))

        items.push({
            key: 'create-organization',
            label: (
                <Space size={4} direction='horizontal'>
                    <PlusCircle size='small'/>
                    <Typography.Text size='small'>{AddOrganizationTitle}</Typography.Text>
                </Space>
            ),
            onClick: showCreateModal,
        })

        return {
            items: items,
        }
    }, [filteredEmployees, selectEmployee, AddOrganizationTitle, showCreateModal])

    if (organizationLoading || !employeesLoaded) {
        return null
    }

    const currentOrgName = get(link, ['organization', 'name'], '')

    return (
        <>
            {!link && !filteredEmployees.length ? (
                <Typography.Link onClick={showCreateModal} size={textSize}>
                    <Space size={4} direction='horizontal'>
                        <PlusCircle size='small'/>
                        {AddOrganizationTitle}
                    </Space>
                </Typography.Link>
            ) : (
                <Dropdown
                    menu={menu}
                    placement='bottomRight'
                    className='organization-dropdown'
                    overlayStyle={DROPDOWN_OVERLAY_STYLES}
                    overlayClassName='organization-dropdown-overlay'
                >
                    <Space size={8} direction='horizontal' className='organization-selector'>
                        <Typography.Text size={textSize}>
                            {currentOrgName}
                        </Typography.Text>
                        <ChevronDown size='small' className='arrow-icon'/>
                    </Space>
                </Dropdown>
            )}
            <CreateOrganizationModalForm />
        </>
    )
}
