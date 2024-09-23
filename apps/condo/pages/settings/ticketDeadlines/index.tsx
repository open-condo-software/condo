import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import {
    TicketDeadlineSettingsAbout,
} from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlineSettingsAbout'
import { TicketDeadlineSettingsForm } from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlineSettingsForm'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'

const ROW_GUTTER: [Gutter, Gutter] = [0, 60]

const TicketDeadlinesContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.pageTitle' })

    return (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
            <Row gutter={ROW_GUTTER}>
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

const TicketDeadlinesPage = () => {
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

TicketDeadlinesPage.requiredAccess = SettingsReadPermissionRequired

export default TicketDeadlinesPage

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const user = await prefetchAuth(client)

    if (!user) {
        return {
            unstable_redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        }
    }

    return extractSSRState(client, req, res, {
        props: {},
    })
}
