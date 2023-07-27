import { Dropdown } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, CSSProperties } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { ChevronDown, PlusCircle } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Typography  } from '@open-condo/ui'
import type { TypographyTextProps } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useCreateOrganizationModalForm } from '@condo/domains/organization/hooks/useCreateOrganizationModalForm'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

import { ASSIGNED_TICKET_VISIBILITY } from '../constants/common'

import type { OrganizationEmployee as OrganizationEmployeeType } from '@app/condo/schema'
import type { DropdownProps } from 'antd'

function compareEmployees (lhs: OrganizationEmployeeType, rhs: OrganizationEmployeeType) {
    lhs.organization.name
    return get(lhs, ['organization', 'name'], '')
        .toLowerCase()
        .localeCompare(
            get(rhs, ['organization', 'name'], '').toLowerCase()
        )
}

const DROPDOWN_OVERLAY_STYLES: CSSProperties = { maxWidth: 300, width: '100%' }

export const InlineOrganizationSelect: React.FC = () => {
    const intl = useIntl()
    const AddOrganizationTitle = intl.formatMessage({ id: 'organizations.createOrganizationButtonLabel' })

    const { breakpoints } = useLayoutContext()
    const textSize: TypographyTextProps['size'] = !breakpoints.TABLET_LARGE ? 'small' : 'medium'

    const router = useRouter()

    const { user } = useAuth()
    const { link, selectLink, isLoading: organizationLoading } = useOrganization()
    const userId = get(user, 'id', null)

    const { objs: userEmployees, allDataLoaded: employeesLoaded } = OrganizationEmployee.useAllObjects({
        where: {
            user: { id: userId },
            isRejected: false,
            isBlocked: false,
            isAccepted: true,
        },
    })

    // Note: Filter case where organization was deleted
    const filteredEmployees = userEmployees.filter(employee => employee.organization)

    const { setIsVisible: showCreateOrganizationModal, ModalForm: CreateOrganizationModalForm } = useCreateOrganizationModalForm({})

    const showCreateModal = useCallback(() => {
        showCreateOrganizationModal(true)
    }, [showCreateOrganizationModal])

    const selectEmployee = useCallback((id: string) => {
        return function () {
            selectLink({ id })
        }
    }, [selectLink])

    // Note Only available section for contractors is tickets,
    // so the case when they were on other page and then changed org to contractors one
    // is processed here
    useDeepCompareEffect(() => {
        if (get(link, ['role', 'ticketVisibilityType']) === ASSIGNED_TICKET_VISIBILITY && !router.route.includes('ticket')) {
            router.push('/ticket')
        }
    }, [link, router])

    useDeepCompareEffect(() => {
        if (employeesLoaded && user) {
            // Note: no current organization selected
            if (!link) {
                // But has organizations to select -> select first one
                if (filteredEmployees.length) {
                    selectLink({ id: filteredEmployees[0].id })
                // No organization -> show modal for creation directly
                } else {
                    showCreateModal()
                }
            // Note: organization in cookie, but value is invalid
            } else if (!filteredEmployees.some(employee => employee.id === link.id)) {
                selectLink(null)
            }
        }
    }, [employeesLoaded, user, link, filteredEmployees, selectLink, showCreateModal])

    const menu = useMemo<DropdownProps['menu']>(() => {
        // Note: spread for sort, since it readonly array
        const sortedEmployees = [...filteredEmployees].sort(compareEmployees)

        const items: DropdownProps['menu']['items'] = sortedEmployees.map(employee => ({
            key: employee.id,
            label: (
                <Typography.Paragraph ellipsis={{ rows: 2 }} size='medium'>
                    {get(employee, ['organization', 'name'], '')}
                </Typography.Paragraph>
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
