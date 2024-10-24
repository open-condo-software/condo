import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'


import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState } from '@condo/domains/common/utils/next/ssr'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import {
    TicketDeadlineSettingsAbout,
} from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlineSettingsAbout'
import { TicketDeadlineSettingsForm } from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlineSettingsForm'

import type { GetServerSideProps } from 'next'


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

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
}
