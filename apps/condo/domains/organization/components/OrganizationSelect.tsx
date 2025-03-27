import {
    useGetActualOrganizationEmployeesQuery,
    useGetEmployeeInvitesCountQuery,
} from '@app/condo/gql'
import { Dropdown } from 'antd'
import uniqBy from 'lodash/uniqBy'
import getConfig from 'next/config'
import React, { useCallback, useMemo, CSSProperties, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { ChevronDown, PlusCircle } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Modal, Space, Typography } from '@open-condo/ui'
import type { TypographyTextProps } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { nonNull } from '@condo/domains/common/utils/nonNull'
import { SecondaryLink } from '@condo/domains/user/components/auth/SecondaryLink'

import { CreateOrganizationForm } from './CreateOrganizationForm'
import { SBBOLIndicator } from './SBBOLIndicator'

import type { OrganizationEmployee as OrganizationEmployeeType } from '@app/condo/schema'
import type { DropdownProps } from 'antd'


const {
    publicRuntimeConfig: { HelpRequisites },
} = getConfig()

function compareEmployees (lhs: OrganizationEmployeeType, rhs: OrganizationEmployeeType) {
    return (lhs?.organization?.name || '').toLowerCase()
        .localeCompare((rhs?.organization?.name || '').toLowerCase())
}

const DROPDOWN_OVERLAY_STYLES: CSSProperties = { maxWidth: 300, width: '100%' }

export const InlineOrganizationSelect: React.FC = () => {
    const intl = useIntl()
    const ChooseOrganizationMessage = intl.formatMessage({ id: 'pages.organizations.ChooseOrganizationLabel' })
    const AddOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationButtonLabel' })
    const OkMessage = intl.formatMessage({ id: 'OK' })
    const EmployeeRequestDescription = intl.formatMessage({ id: 'organization.createOrganizationForm.request.description' })
    const ChatInTelegramMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.supportChat' })
    const EmployeeRequestAlertDescription = intl.formatMessage({ id: 'organization.createOrganizationForm.request.alert.description' }, {
        chatBotLink: (
            <SecondaryLink target='_blank' href={HelpRequisites?.support_bot ? `https://t.me/${HelpRequisites.support_bot}` : '#'}>
                {ChatInTelegramMessage}
            </SecondaryLink>
        ),
    })

    const { persistor } = useCachePersistor()
    const { breakpoints } = useLayoutContext()
    const textSize: TypographyTextProps['size'] = useMemo(() => !breakpoints.TABLET_LARGE ? 'small' : 'medium', [breakpoints.TABLET_LARGE])
    const { user } = useAuth()
    const userId = useMemo(() => user?.id, [user?.id])
    const {
        employee: activeEmployee,
        organization,
        selectEmployee: setActiveEmployee,
        isLoading: organizationLoading,
    } = useOrganization()

    const [isCreateOrganizationModalOpen, setIsCreateOrganizationModalOpen] = useState<boolean>(false)
    const [organizationWithRequest, setOrganizationWithRequest] = useState<{ name: string, isDuplicateRequest: boolean } | null>(null)

    const {
        data: actualEmployeesData,
        loading: isActualEmployeeLoading,
        previousData: previousEmployeesData,
    } = useGetActualOrganizationEmployeesQuery({
        variables: { userId },
        skip: !userId || !persistor,
    })
    const actualData = useMemo(() => actualEmployeesData?.actualEmployees?.filter(nonNull) || [], [actualEmployeesData?.actualEmployees])
    const prevData = useMemo(() => previousEmployeesData?.actualEmployees?.filter(nonNull) || [], [previousEmployeesData?.actualEmployees])
    const actualEmployees = useMemo(() => !actualData.length ? prevData : actualData, [actualData, prevData])
    const currentOrgName = useMemo(() => organization?.name || ChooseOrganizationMessage, [ChooseOrganizationMessage, organization?.name])
    // Note: Filter case where organization was deleted
    const filteredEmployees = useMemo(() =>
        uniqBy(actualEmployees.filter(employee => employee.organization), employee => employee.organization.id),
    [actualEmployees]
    )

    const { data: invites, loading: isInvitesLoading } = useGetEmployeeInvitesCountQuery({
        variables: { userId },
        skip: !userId || !persistor || !!activeEmployee?.id || actualEmployees.length > 0,
    })
    const hasInvites = useMemo(() => invites?.meta?.count > 0, [invites?.meta?.count])

    useDeepCompareEffect(() => {
        if (!persistor) return
        if (!user) return
        if (isActualEmployeeLoading || isInvitesLoading) return

        // Note: no current organization selected
        if (!activeEmployee) {
            // But has organizations to select -> select first one
            if (filteredEmployees.length) {
                setActiveEmployee(filteredEmployees[0].id)
            }
            // Note: organization in cookie, but value is invalid
        } else if (!filteredEmployees.some(employee => employee.id === activeEmployee.id)) {
            setActiveEmployee(null)
        }
    }, [isActualEmployeeLoading, user, activeEmployee, filteredEmployees, setActiveEmployee, isInvitesLoading, hasInvites, persistor])

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
                    <SBBOLIndicator organization={employee?.organization || null} />
                    <Typography.Paragraph ellipsis={{ rows: 2 }} size='medium'>
                        {employee?.organization?.name || ''}
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
            onClick: () => setIsCreateOrganizationModalOpen(true),
        })

        return {
            items: items,
        }
    }, [filteredEmployees, AddOrganizationTitle, handleClickOrganization])

    if (organizationLoading || isActualEmployeeLoading) {
        return null
    }

    return (
        <>
            {
                !activeEmployee && !filteredEmployees.length
                    ? (
                        <Typography.Link onClick={() => setIsCreateOrganizationModalOpen(true)} size={textSize}>
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
            <CreateOrganizationForm
                type='modal'
                isCreateOrganizationModalOpen={isCreateOrganizationModalOpen}
                setIsCreateOrganizationModalOpen={setIsCreateOrganizationModalOpen}
                onSendOrganizationRequest={(organizationEmployeeRequest, isDuplicateRequest) => {
                    setIsCreateOrganizationModalOpen(false)

                    if (organizationEmployeeRequest) {
                        setOrganizationWithRequest({
                            name: organizationEmployeeRequest?.organizationName,
                            isDuplicateRequest,
                        })
                    }
                }}
                onOrganizationCreated={() => {
                    setIsCreateOrganizationModalOpen(false)
                }}
            />
            <Modal
                open={organizationWithRequest !== null}
                title={
                    organizationWithRequest?.isDuplicateRequest ?
                        intl.formatMessage(
                            { id: 'organization.createOrganizationForm.request.duplicate.title' },
                            {
                                organizationName: organizationWithRequest?.name,
                            }
                        ) :
                        intl.formatMessage(
                            { id: 'organization.createOrganizationForm.request.title' },
                            {
                                organizationName: organizationWithRequest?.name,
                            }
                        )
                }
                onCancel={() => setOrganizationWithRequest(null)}
                footer={(
                    <Button type='primary' onClick={() => setOrganizationWithRequest(null)}>
                        {OkMessage}
                    </Button>
                )}
            >
                <Space size={24} direction='vertical'>
                    <Typography.Text type='secondary'>
                        {EmployeeRequestDescription}
                    </Typography.Text>
                    <Alert
                        showIcon
                        type='info'
                        description={EmployeeRequestAlertDescription}
                    />
                </Space>
            </Modal>
        </>
    )
}
