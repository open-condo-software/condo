import { Col, Row, RowProps } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageComponentType } from '@condo/domains/common/types'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'


const ROW_MESSAGE_GUTTER: RowProps['gutter'] = [0, 14]
const FailureSrc = { main: '/404Poster.webp' }

const FailurePage: PageComponentType = () => {
    const intl = useIntl()
    const router = useRouter()

    const { alreadyPaid, linkNotActual } = router.query

    let PageTitle
    let Description

    if (alreadyPaid) {
        PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.payment.failure.alreadyPaid.title' })
        Description = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.payment.failure.linkNotActual' })
    } else if (linkNotActual) {
        PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.payment.failure.linkNotActual.title' })
        Description = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.payment.failure.linkNotActual' })
    } else {
        PageTitle = intl.formatMessage( { id: 'pages.condo.marketplace.invoice.payment.failure.title' })
        Description = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.payment.failure.description' })
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <Row justify='start'>
                <ResponsiveCol span={24} desktopWidth={470}>
                    <Row gutter={ROW_MESSAGE_GUTTER}>
                        <Col span={24}>
                            <Typography.Title>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Typography.Paragraph>
                                {Description}
                            </Typography.Paragraph>
                        </Col>
                    </Row>
                </ResponsiveCol>
            </Row>
        </>
    )
}

const FailurePageLayout = (props): React.ReactElement => (
    <PosterLayout
        {...props}
        image={FailureSrc}
    />
)

FailurePage.container = FailurePageLayout
FailurePage.skipUserPrefetch = true

export default FailurePage
