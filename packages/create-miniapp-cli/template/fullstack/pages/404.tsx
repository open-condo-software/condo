import { Typography } from 'antd'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { EmptyView } from '~/domains/common/components/containers/EmptyView'

const EMPTY_VIEW_IMAGE_STYLE: CSSProperties = { marginBottom: 20 }

const Custom404: React.FC = () => {
    const intl = useIntl()
    const NotFoundErrorTitle = intl.formatMessage({ id: 'pages.condo.error.NotFoundTitle' })
    const NotFoundErrorMessage = intl.formatMessage({ id: 'pages.condo.error.NotFoundDescription' })

    return (
        <EmptyView
            image='/mascot/fail.webp'
            spaceSize={16}
            imageStyle={EMPTY_VIEW_IMAGE_STYLE}
        >
            <Typography.Title level={4}>
                {NotFoundErrorTitle}
            </Typography.Title>
            <Typography.Text type='secondary'>
                {NotFoundErrorMessage}
            </Typography.Text>
        </EmptyView>
    )
}

export default Custom404
