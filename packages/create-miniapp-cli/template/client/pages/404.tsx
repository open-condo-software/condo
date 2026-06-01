/* eslint-disable */
import { Typography } from 'antd'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { EmptyView } from '~/domains/common/components/containers/EmptyView'

const EMPTY_VIEW_IMAGE_STYLE: CSSProperties = { marginBottom: 20 }

const Custom404: React.FC = () => {
    const intl = useIntl()
    const title = intl.formatMessage({ id: 'pages.condo.error.NotFoundTitle' })
    const description = intl.formatMessage({ id: 'pages.condo.error.NotFoundDescription' })

    return (
        <EmptyView
            image='/mascot/fail.webp'
            spaceSize={16}
            imageStyle={EMPTY_VIEW_IMAGE_STYLE}
        >
            <Typography.Title level={4}>{title}</Typography.Title>
            <Typography.Text type='secondary'>{description}</Typography.Text>
        </EmptyView>
    )
}

Object.assign(Custom404, { allowUnauthorized: true })

export default Custom404
