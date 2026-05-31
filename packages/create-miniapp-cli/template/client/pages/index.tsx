import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Space, Typography } from '@open-condo/ui'
// @if OIDC
import { useAuth } from '@open-condo/next/auth'
// @endif

const IndexPage = () => {
    const intl = useIntl()
    // @if OIDC
    const { user } = useAuth()
    // @endif

    return (
        <Space direction='vertical' size={12}>
            <Typography.Title level={1}>
                {intl.formatMessage({ id: 'pages.index.title' })}
            </Typography.Title>
            <Typography.Text>
                {intl.formatMessage({ id: 'pages.index.subtitle' })}
            </Typography.Text>
            {/* @if OIDC */}
            {user?.id && (
                <Typography.Text type='secondary'>
                    {intl.formatMessage({ id: 'pages.index.user' })}: {user.id}
                </Typography.Text>
            )}
            <Button type='secondary' onClick={() => window.location.assign('/api/oidc/logout')}>
                {intl.formatMessage({ id: 'pages.index.logoutOidc' })}
            </Button>
            {/* @endif */}
        </Space>
    )
}

export default IndexPage
