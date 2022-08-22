import React from 'react'
import Head from 'next/head'
import { Col, Row, Typography } from 'antd'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIntl } from '@condo/next/intl'
import { TicketDeadlineSettingsForm } from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlineSettingsForm'
import {
    TicketDeadlineSettingsAbout,
} from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlineSettingsAbout'

const TicketDeadlinesContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.pageTitle' })

    return (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
            <Row gutter={[0, 60]}>
                <Col span={24}>
                    <TicketDeadlineSettingsAbout />
                </Col>
                <Col span={24}>
                    <TicketDeadlineSettingsForm />
                </Col>
            </Row>
        </>
    )
}

const TicketDeadlinesPage: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.pageTitle' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <TicketDeadlinesContent />
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default TicketDeadlinesPage
