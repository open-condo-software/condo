// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { css } from '@emotion/core'
import { Spin, Typography } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import qs from 'qs'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { AuthRequired } from '../../common/components/containers/AuthRequired'
import { isFunction } from '../../common/utils/ecmascript.utils'

function RedirectToOrganizations () {
    const { asPath } = useRouter()

    const intl = useIntl()
    const RedirectingMsg = intl.formatMessage({ id: 'Redirecting' })

    useEffect(() => {
        const clearHandle = setTimeout(() => {
            Router.push('/organizations?' + qs.stringify({ next: asPath }))
        }, 200)
        return () => {
            clearTimeout(clearHandle)
        }
    })
    return <Typography.Text css={css`display: block; text-align: center;`}>{RedirectingMsg}</Typography.Text>
}

function OrganizationRequiredAfterAuthRequired ({ children }) {
    const intl = useIntl()
    const SelectOrganizationRequiredMessage = intl.formatMessage({ id: 'SelectOrganizationRequired' })
    const EmployeeRestrictedTitle = intl.formatMessage({ id: 'employee.emptyList.title' })
    const EmployeeRestrictedDescription = intl.formatMessage({ id: 'employee.emptyList.description' })

    const { isLoading: isLoadingAuth } = useAuth()
    const organization = useOrganization()
    const { isLoading, link } = organization

    if (isLoading || isLoadingAuth) {
        return <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin/>}/>
    }

    if (!link) {
        return (
            <>
                <Typography.Title css={css`display: block; text-align: center;`}>
                    {SelectOrganizationRequiredMessage}
                </Typography.Title>
                <RedirectToOrganizations/>
            </>
        )
    }

    const isEmployeeBlocked = get(link, 'isBlocked', false)
    const organizationName = get(link, ['organization', 'name'])

    if (isEmployeeBlocked) {
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

export function OrganizationRequired ({ children }) {
    return (
        <AuthRequired>
            <OrganizationRequiredAfterAuthRequired>{children}</OrganizationRequiredAfterAuthRequired>
        </AuthRequired>
    )
}
