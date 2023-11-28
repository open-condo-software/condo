import { ErrorLayoutFooter, ErrorLayoutHeader } from '@app/condo/pages/500'
import { Col, Row, RowProps, Typography } from 'antd'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { fontSizes } from '@condo/domains/common/constants/style'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'


const DESCRIPTION_TEXT_STYLE = { fontSize: fontSizes.content }
const ROW_MESSAGE_GUTTER: RowProps['gutter'] = [0, 14]
const FailureSrc = { poster: '/404Poster.webp' }

export default function FailurePage () {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.marketplace.invoice.payment.failure.title' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.payment.failure.description' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <Row justify='center'>
                <Col span={24}>
                    <Row gutter={ROW_MESSAGE_GUTTER}>
                        <Col span={24}>
                            <Typography.Title>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Typography.Paragraph style={DESCRIPTION_TEXT_STYLE}>
                                {DescriptionMessage}
                            </Typography.Paragraph>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </>
    )
}

const FailurePageLayout = (props): React.ReactElement => (
    <PosterLayout
        {...props}
        Header={<ErrorLayoutHeader />}
        Footer={<ErrorLayoutFooter />}
        layoutBgImage={FailureSrc}
    />
)

FailurePage.container = FailurePageLayout