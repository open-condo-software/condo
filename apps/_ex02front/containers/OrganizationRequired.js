/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Spin, Typography } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import qs from 'qs'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'

import { AuthRequired } from './AuthRequired'
import { isFunction } from '../utils/ecmascript.utils'

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
    const { isLoading: isLoadingAuth } = useAuth()
    const organization = useOrganization()
    const { isLoading, link } = organization

    const intl = useIntl()
    const SelectOrganizationRequiredMsg = intl.formatMessage({ id: 'SelectOrganizationRequired' })

    if (isLoading || isLoadingAuth) {
        const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin/>
        return <Spin indicator={antIcon}/>
    }

    if (!link) return <>
        <Typography.Title css={css`display: block; text-align: center;`}>
            {SelectOrganizationRequiredMsg}
        </Typography.Title>
        <RedirectToOrganizations/>
    </>

    if (isFunction(children)) {
        return children(organization)
    }

    return children
}

export function OrganizationRequired ({ children }) {
    return <AuthRequired>
        <OrganizationRequiredAfterAuthRequired>{children}</OrganizationRequiredAfterAuthRequired>
    </AuthRequired>
}
