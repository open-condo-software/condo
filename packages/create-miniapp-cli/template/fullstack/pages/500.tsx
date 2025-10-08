import { Typography } from 'antd'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { EmptyView } from '@billing-connector/domains/common/components/containers/EmptyView'

const EMPTY_VIEW_IMAGE_STYLE: CSSProperties = { marginBottom: 20 }

const Custom500: React.FC = () => {
    const intl = useIntl()
    const LoadingErrorTitle = intl.formatMessage({ id: 'miniapp.loadingError.title' })
    const LoadingErrorMessage = intl.formatMessage({ id: 'miniapp.loadingError.message' })

    return (
        <EmptyView
            image='/dino/waiting@2x.png'
            spaceSize={16}
            imageStyle={EMPTY_VIEW_IMAGE_STYLE}
        >
            <Typography.Title level={4}>
                {LoadingErrorTitle}
            </Typography.Title>
            <Typography.Text type='secondary'>
                {LoadingErrorMessage}
            </Typography.Text>
        </EmptyView>
    )
}

export default Custom500