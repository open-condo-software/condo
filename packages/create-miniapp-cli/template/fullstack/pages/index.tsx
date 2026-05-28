import React from 'react'
import { useIntl } from 'react-intl'

import { Space, Typography } from '@open-condo/ui'

const IndexPage = () => {
    const intl = useIntl()

    return (
        <Space direction='vertical' size={12}>
            <Typography.Title level={1}>
                {intl.formatMessage({ id: 'pages.index.title' })}
            </Typography.Title>
            <Typography.Text>
                {intl.formatMessage({ id: 'pages.index.subtitle' })}
            </Typography.Text>
        </Space>
    )
}

export default IndexPage
