// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { css } from '@emotion/core'
import { Typography } from 'antd'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { isFunction } from '@condo/domains/common/utils/ecmascript.utils'
import { Loader } from '@condo/domains/common/components/Loader'

const OrganizationRequiredAfterAuthRequired: React.FC<{ withEmployeeRestrictions?: boolean }> = ({ children, withEmployeeRestrictions }) => {
    const intl = useIntl()
    const EmployeeRestrictedTitle = intl.formatMessage({ id: 'employee.emptyList.title' })
    const EmployeeRestrictedDescription = intl.formatMessage({ id: 'employee.emptyList.description' })
    const SelectOrganizationRequiredMessage = intl.formatMessage({ id: 'SelectOrganizationRequired' })

    const { isLoading: isLoadingAuth } = useAuth()
    const organization = useOrganization()
    const { isLoading, link } = organization

    if (isLoading || isLoadingAuth) {
        return <Loader/>
    }

    if (!link) {
        return (
            <>
                <Typography.Title css={css`display: block; text-align: center;`}>
                    {SelectOrganizationRequiredMessage}
                </Typography.Title>
            </>
        )
    }

    const isEmployeeBlocked = get(link, 'isBlocked', false)
    const organizationName = get(link, ['organization', 'name'])

    if (isEmployeeBlocked && withEmployeeRestrictions) {
        return (
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

    if (isFunction(children)) {
        return children(organization)
    }

    return children
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
