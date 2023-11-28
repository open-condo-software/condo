import { ErrorLayoutFooter, ErrorLayoutHeader } from '@app/condo/pages/500'
import { Col, Row, RowProps, Typography } from 'antd'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { fontSizes } from '@condo/domains/common/constants/style'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'


const DESCRIPTION_TEXT_STYLE = { fontSize: fontSizes.content }
const ROW_MESSAGE_GUTTER: RowProps['gutter'] = [0, 14]
const SuccessSrc = { poster: '/successDino.webp' }

export default function SuccessPage () {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.marketplace.invoice.payment.success.title' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.payment.success.description' })
    const DownloadAppMessageButton = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.payment.success.downloadApp' })

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
                        <Col>
                            <Typography.Link href='https://onelink.to/doma'>
                                <Button
                                    key='submit'
                                    type='secondary'
                                    block
                                >
                                    {DownloadAppMessageButton}
                                </Button>
                            </Typography.Link>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </>
    )
}

const SuccessPageLayout = (props): React.ReactElement => (
    <PosterLayout
        {...props}
        Header={<ErrorLayoutHeader />}
        Footer={<ErrorLayoutFooter />}
        layoutBgImage={SuccessSrc}
    />
)

SuccessPage.container = SuccessPageLayout