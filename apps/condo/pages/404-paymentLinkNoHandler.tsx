import { Col, Row, RowProps } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageComponentType } from '@condo/domains/common/types'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'


const ROW_MESSAGE_GUTTER: RowProps['gutter'] = [0, 14]
const Src404 = { main: '/404Poster.webp', placeholder: '/404PosterPlaceholder.jpg' }

const Custom404: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.error.paymentLinkHandler.NotFoundTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.error.paymentLinkHandler.NotFoundDescription' })

    return (
        <Row justify='center'>
            <Col span={24}>
                <Row gutter={ROW_MESSAGE_GUTTER}>
                    <Col span={24}>
                        <Typography.Title>{PageTitle}</Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Typography.Paragraph>
                            {DescriptionMessage}
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}

const Error404Layout = (props): React.ReactElement => <PosterLayout
    {...props}
    image={Src404}
/>

Custom404.container = Error404Layout
Custom404.isError = true
Custom404.skipUserPrefetch = true

export default Custom404
