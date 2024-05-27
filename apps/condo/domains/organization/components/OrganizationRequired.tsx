import { Typography } from 'antd'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'


const OrganizationRequiredAfterAuthRequired: React.FC<{ withEmployeeRestrictions?: boolean }> = ({ children, withEmployeeRestrictions }) => {
    const intl = useIntl()
    const EmployeeRestrictedTitle = intl.formatMessage({ id: 'employee.emptyList.title' })
    const EmployeeRestrictedDescription = intl.formatMessage({ id: 'employee.emptyList.description' })
    const SelectOrganizationRequiredMessage = intl.formatMessage({ id: 'SelectOrganizationRequired' })
    const { isLoading: isLoadingAuth } = useAuth()
    const organization = useOrganization()

    const { isLoading, link } = organization

    let pageView = children

    if (isLoading || isLoadingAuth) {
        pageView = <Loader fill size='large'/>
    }

    if (!link && !isLoading) {
        pageView = (
            <>
                <Typography.Title style={{ textAlign: 'center' }}>
                    {SelectOrganizationRequiredMessage}
                </Typography.Title>
            </>
        )
    }

    const isEmployeeBlocked = get(link, 'isBlocked', false)
    const organizationName = get(link, ['organization', 'name'])

    if (isEmployeeBlocked && withEmployeeRestrictions) {
        pageView = (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {EmployeeRestrictedTitle}
                </Typography.Title>
                <Typography.Text>
                    {EmployeeRestrictedDescription}
                    <Typography.Text strong> «{organizationName}».</Typography.Text>
                </Typography.Text>
            </BasicEmptyListView>
        )
    }

    return (
        <>
            {pageView}
        </>
    )
}

export const OrganizationRequired: React.FC<{ withEmployeeRestrictions?: boolean }> = ({ children, withEmployeeRestrictions = true }) => {
    return (
        <AuthRequired>
            <OrganizationRequiredAfterAuthRequired withEmployeeRestrictions={withEmployeeRestrictions}>
                {children}
            </OrganizationRequiredAfterAuthRequired>
        </AuthRequired>
    )
}

type PermissionRequiredPageProps = {
    permissionKeys: string[]
}

const PermissionsRequiredWrapper: React.FC<PermissionRequiredPageProps> = ({ children, permissionKeys }) => {
    const { link } = useOrganization()

    const role = useMemo(() => get(link, 'role'), [link])

    const isAccessDenied = useMemo(() => {
        if (!role) return true

        for (const permissionKey of permissionKeys) {
            if (!role[permissionKey]) {
                return true
            }
        }

        return false
    }, [permissionKeys, role])

    if (isAccessDenied) {
        return <AccessDeniedPage />
    }

    return <>{children}</>
}

export const PermissionsRequired: React.FC<PermissionRequiredPageProps> = ({ children, permissionKeys }) => {
    return (
        <OrganizationRequired>
            <PermissionsRequiredWrapper permissionKeys={permissionKeys}>
                {children}
            </PermissionsRequiredWrapper>
        </OrganizationRequired>
    )
}