// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { css } from '@emotion/core'
import { Spin, Typography } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import qs from 'qs'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'

import { isFunction } from '../../utils/ecmascript.utils'

function RedirectToLogin () {
    const intl = useIntl()
    const RedirectingMessage = intl.formatMessage({ id: 'Redirecting' })

    const { asPath } = useRouter()

    useEffect(() => {
        const clearHandle = setTimeout(() => {
            Router.push('/auth/signin?' + qs.stringify({ next: asPath }))
        }, 200)
        return () => {
            clearTimeout(clearHandle)
        }
    })
    return <Typography.Text css={css`display: block; text-align: center;`}>{RedirectingMessage}</Typography.Text>
}

export function AuthRequired ({ children }) {
    const intl = useIntl()
    const SignInRequiredMessage = intl.formatMessage({ id: 'SignInRequired' })

    const auth = useAuth()
    const { isAuthenticated, isLoading } = auth

    if (isLoading) {
        const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin/>
        return <Spin indicator={antIcon}/>
    }

    if (!isAuthenticated) {
        return <>
            <Typography.Title css={css`display: block; text-align: center;`}>{SignInRequiredMessage}</Typography.Title>
            <RedirectToLogin/>
        </>
    }

    if (isFunction(children)) {
        return children(auth)
    }

    return children
}
