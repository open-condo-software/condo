import {
    useGetActualOrganizationEmployeesQuery,
    useGetEmployeeInvitesCountQuery,
} from '@app/condo/gql'
import { OrganizationTypeType } from '@app/condo/schema'
import { Dropdown } from 'antd'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
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

import { CreateOrganizationForm } from './CreateOrganizationForm'
import { SBBOLIndicator } from './SBBOLIndicator'

import type { OrganizationEmployee as OrganizationEmployeeType } from '@app/condo/schema'
import type { DropdownProps } from 'antd'


function compareEmployees (lhs: OrganizationEmployeeType, rhs: OrganizationEmployeeType) {
    return (lhs?.organization?.name || '').toLowerCase()
        .localeCompare((rhs?.organization?.name || '').toLowerCase())
}

const DROPDOWN_OVERLAY_STYLES: CSSProperties = { maxWidth: 300, width: '100%' }

export const InlineOrganizationSelect: React.FC = () => {
    const intl = useIntl()
    const ChooseOrganizationMessage = intl.formatMessage({ id: 'pages.organizations.ChooseOrganizationLabel' })
    const AddOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationButtonLabel' })

    const [isCreateOrganizationModalOpen, setIsCreateOrganizationModalOpen] = useState<boolean>(false)
    // show modal if user sent OrganizationEmployeeRequest by tin
    const [organizationWithRequest, setOrganizationWithRequest] = useState<{ name: string, isDuplicateRequest: boolean } | null>(null)

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

    const currentOrgName = organization?.name || ChooseOrganizationMessage

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
                title={organizationWithRequest?.isDuplicateRequest ?
                    `Запрос в ${organizationWithRequest?.name} уже был отправлен` :
                    `Запрос в ${organizationWithRequest?.name} отправлен`
                }
                onCancel={() => setOrganizationWithRequest(null)}
                footer={(
                    <Button type='primary' onClick={() => setOrganizationWithRequest(null)}>
                        Хорошо
                    </Button>
                )}
            >
                <Space size={24} direction='vertical'>
                    <Typography.Text type='secondary'>
                        Как только администратор одобрит ваш запрос, вам придет СМС-подтверждение и откроется доступ к платформе
                    </Typography.Text>
                    <Alert
                        showIcon
                        type='info'
                        description='Если запрос долго не подтверджают, обратитесь в вашу организацию или напишите в чат поддержки'
                    />
                </Space>
            </Modal>
        </>
    )
}
