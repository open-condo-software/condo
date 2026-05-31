import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Button, Space, Typography } from '@open-condo/ui'

const SignInPage = () => {
    const intl = useIntl()
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    React.useEffect(() => {
        if (isAuthenticated) {
            router.replace('/')
        }
    }, [isAuthenticated, router])

    return (
        <>
            <Head><title>{intl.formatMessage({ id: 'pages.auth.signin.title' })}</title></Head>
            <Space direction='vertical' size={16}>
                <Typography.Title level={2}>
                    {intl.formatMessage({ id: 'pages.auth.signin.header' })}
                </Typography.Title>
                {/* @if OIDC */}
                <Button type='primary' onClick={() => window.location.assign('/api/oidc/auth')}>
                    {intl.formatMessage({ id: 'pages.auth.signin.authorizeOidc' })}
                </Button>
                {/* @endif */}
            </Space>
        </>
    )
}

Object.assign(SignInPage, { allowUnauthorized: true })

export default SignInPage
