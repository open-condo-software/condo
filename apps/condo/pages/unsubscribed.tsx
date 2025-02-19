import { Col, Row } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageComponentType } from '@condo/domains/common/types'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'


const SrcUnsubscribe = { main: '/successDino.webp' }

const Unsubscribe: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.notification.unsubscribed.PageTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.notification.unsubscribed.Description' })

    return (
        <Row justify='space-between'>
            <Col span={24}>
                <Row gutter={[0, 14]} justify='center'>
                    <Col span={18}>
                        <Typography.Title>{PageTitle}</Typography.Title>
                    </Col>
                    <Col span={18}>
                        <Typography.Paragraph>
                            {DescriptionMessage}
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}

const UnsubscribeLayout = (props): React.ReactElement => <PosterLayout
    {...props}
    image={SrcUnsubscribe}
/>

Unsubscribe.container = UnsubscribeLayout
Unsubscribe.skipUserPrefetch = true

export default Unsubscribe
