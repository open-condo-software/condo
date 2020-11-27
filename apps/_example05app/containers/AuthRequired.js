/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Spin, Typography } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import qs from 'qs'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'

import { isFunction } from '../utils/ecmascript.utils'

function RedirectToLogin () {
    const { asPath } = useRouter()

    const intl = useIntl()
    const RedirectingMsg = intl.formatMessage({ id: 'Redirecting' })

    useEffect(() => {
        const clearHandle = setTimeout(() => {
            Router.push('/auth/signin?' + qs.stringify({ next: asPath }))
        }, 200)
        return () => {
            clearTimeout(clearHandle)
        }
    })
    return <Typography.Text css={css`display: block; text-align: center;`}>{RedirectingMsg}</Typography.Text>
}

export function AuthRequired ({ children }) {
    const auth = useAuth()
    const { isAuthenticated, isLoading } = auth

    const intl = useIntl()
    const SignInRequiredMsg = intl.formatMessage({ id: 'SignInRequired' })

    if (isLoading) {
        const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin/>
        return <Spin indicator={antIcon}/>
    }

    if (!isAuthenticated) {
        return <>
            <Typography.Title css={css`display: block; text-align: center;`}>{SignInRequiredMsg}</Typography.Title>
            <RedirectToLogin/>
        </>
    }

    if (isFunction(children)) {
        return children(auth)
    }

    return children
}
