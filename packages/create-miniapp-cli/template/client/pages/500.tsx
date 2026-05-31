import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'

const Custom500 = () => {
    const intl = useIntl()

    return (
        <Space direction='vertical' size={12}>
            <img src='/mascot/waiting.webp' width={120} height={120} alt='500 error'/>
            <Typography.Title level={3}>
                {intl.formatMessage({ id: 'pages.error.500.title' })}
            </Typography.Title>
            <Typography.Text type='secondary'>
                {intl.formatMessage({ id: 'pages.error.500.description' })}
            </Typography.Text>
        </Space>
    )
}

Object.assign(Custom500, { allowUnauthorized: true })

export default Custom500
