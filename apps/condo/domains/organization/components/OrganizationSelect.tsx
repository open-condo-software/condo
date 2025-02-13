import {
    useGetActualOrganizationEmployeesQuery,
    useGetEmployeeInvitesCountQuery,
} from '@app/condo/gql'
import { OrganizationTypeType } from '@app/condo/schema'
import { Dropdown } from 'antd'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, CSSProperties } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { ChevronDown, PlusCircle } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Typography } from '@open-condo/ui'
import type { TypographyTextProps } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { nonNull } from '@condo/domains/common/utils/nonNull'
import { useCreateOrganizationModalForm } from '@condo/domains/organization/hooks/useCreateOrganizationModalForm'

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

export const InlineOrganizationSelect: React.FC = () => {
    const intl = useIntl()
    const ChooseOrganizationMessage = intl.formatMessage({ id: 'pages.organizations.ChooseOrganizationLabel' })
    const AddOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationButtonLabel' })

    const { persistor } = useCachePersistor()
    const router = useRouter()

    const { breakpoints } = useLayoutContext()
    const textSize: TypographyTextProps['size'] = !breakpoints.TABLET_LARGE ? 'small' : 'medium'

    const { user } = useAuth()
    const {
        employee: activeEmployee,
        organization,
        selectEmployee: setActiveEmployee,
        isLoading: organizationLoading,
    } = useOrganization()
    const userId = user?.id || null

    const {
        data: actualEmployeesData,
        loading: isActualEmployeeLoading,
        previousData: previousEmployeesData,
    } = useGetActualOrganizationEmployeesQuery({
        variables: { userId },
        skip: !userId || !persistor,
        // fetchPolicy: 'cache-and-network',
        pollInterval: 15 * 60 * 1000, // should be not more then cache ttl
    })
    const actualData = useMemo(() => actualEmployeesData?.actualEmployees?.filter(nonNull) || [], [actualEmployeesData?.actualEmployees])
    const prevData = useMemo(() => previousEmployeesData?.actualEmployees?.filter(nonNull) || [], [previousEmployeesData?.actualEmployees])
    const actualEmployees = useMemo(
        () => !actualData.length ? prevData : actualData
        , [actualData, prevData]
    )

    const { data: invites, loading: isInvitesLoading } = useGetEmployeeInvitesCountQuery({
        variables: { userId },
        skip: !userId || !persistor || !!activeEmployee?.id || actualEmployees.length > 0,
    })
    const hasInvites = invites?.meta?.count > 0

    // Note: Filter case where organization was deleted
    const filteredEmployees = useMemo(() =>
        uniqBy(actualEmployees.filter(employee => employee.organization), employee => employee.organization.id),
    [actualEmployees]
    )

    const { setIsVisible: showCreateOrganizationModal, ModalForm: CreateOrganizationModalForm } = useCreateOrganizationModalForm({
        onFinish: async (createdOrganization) => {
            const organizationType = get(createdOrganization, 'type')

            // The slash will only be there if we have just registered and we don't have any additional parameters in the address bar.
            if (organizationType === OrganizationTypeType.ManagingCompany && router.route === '/') {
                await router.push('/tour')
            }
        },
    })

    const showCreateModal = useCallback(() => {
        showCreateOrganizationModal(true)
    }, [showCreateOrganizationModal])

    useDeepCompareEffect(() => {
        if (!persistor) return
        if (!user) return
        if (isActualEmployeeLoading || isInvitesLoading) return

        // Note: no current organization selected
        if (!activeEmployee) {
            // But has organizations to select -> select first one
            if (filteredEmployees.length) {
                setActiveEmployee(filteredEmployees[0].id)
                // No organization -> show modal for creation directly
            } else if (!hasInvites) {
                showCreateModal()
            }
            // Note: organization in cookie, but value is invalid
        } else if (!filteredEmployees.some(employee => employee.id === activeEmployee.id)) {
            setActiveEmployee(null)
        }
    }, [isActualEmployeeLoading, user, activeEmployee, filteredEmployees, setActiveEmployee, showCreateModal, isInvitesLoading, hasInvites, persistor])

    const handleClickOrganization = useCallback((employeeId: string) => {
        return () => setActiveEmployee(employeeId)
    }, [setActiveEmployee])

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
            onClick: handleClickOrganization(employee.id),
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
    }, [filteredEmployees, AddOrganizationTitle, showCreateModal, handleClickOrganization])

    if (organizationLoading || isActualEmployeeLoading) {
        return null
    }

    const currentOrgName = get(organization, 'name', ChooseOrganizationMessage)

    return (
        <>
            {
                !activeEmployee && !filteredEmployees.length
                    ? (
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
                    )
            }
            <CreateOrganizationModalForm />
        </>
    )
}
