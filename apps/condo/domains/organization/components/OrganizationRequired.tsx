import { Typography } from 'antd'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { OnBoarding as OnBoardingHooks } from '@condo/domains/onboarding/utils/clientSchema'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { Loader } from '@condo/domains/common/components/Loader'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const OrganizationRequiredAfterAuthRequired: React.FC<{ withEmployeeRestrictions?: boolean }> = ({ children, withEmployeeRestrictions }) => {
    const intl = useIntl()
    const EmployeeRestrictedTitle = intl.formatMessage({ id: 'employee.emptyList.title' })
    const EmployeeRestrictedDescription = intl.formatMessage({ id: 'employee.emptyList.description' })
    const SelectOrganizationRequiredMessage = intl.formatMessage({ id: 'SelectOrganizationRequired' })
    const { isLoading: isLoadingAuth, user } = useAuth()
    const organization = useOrganization()
    const router = useRouter()

    const { obj: onBoardingHookObj, loading: isOnBoardingLoading } = OnBoardingHooks
        .useObject(
            { where: { user: { id: get(user, 'id') } } },
            { fetchPolicy: 'network-only' },
        )

    const { isLoading, link } = organization

    useEffect(() => {
        if (isOnBoardingLoading || isLoadingAuth || isLoading) return
        if (!link) {
            if (onBoardingHookObj && !get(onBoardingHookObj, 'completed', false)) {
                router.push('/onboarding')
            }
        }
    }, [isOnBoardingLoading, isLoadingAuth, isLoading, onBoardingHookObj, link])

    let pageView = children

    if (isLoading || isLoadingAuth) {
        pageView = <Loader/>
    }

    if (!link) {
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
