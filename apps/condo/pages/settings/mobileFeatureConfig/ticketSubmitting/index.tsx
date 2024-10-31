import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'


import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState, ifSsrIsNotDisabled } from '@condo/domains/common/utils/next/ssr'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import {
    TicketSubmittingSettingsForm,
} from '@condo/domains/settings/components/ticketSubmitting/TicketSubmittingSettingsForm'
import { MobileFeatureConfig } from '@condo/domains/settings/utils/clientSchema'

import type { GetServerSideProps } from 'next'


const ROW_GUTTER: [Gutter, Gutter] = [0, 60]

const TicketSubmittingContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.mobileFeatureConfig.submittingPeriod.pageTitle' })
    
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'], null)

    const { obj: mobileConfig, loading } = MobileFeatureConfig.useObject({
        where: {
            organization: { id: userOrganizationId },
        },
    })
    return loading ? <Loader fill size='small'/> : (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
            <Row gutter={ROW_GUTTER}>
                <Col span={24}>
                    <TicketSubmittingSettingsForm mobileConfig={mobileConfig} userOrganizationId={userOrganizationId}/>
                </Col>
            </Row>
        </>
    )
}

const TicketSubmittingPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.pageTitle' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <TicketSubmittingContent />
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketSubmittingPage.requiredAccess = SettingsReadPermissionRequired

export default TicketSubmittingPage

export const getServerSideProps: GetServerSideProps = ifSsrIsNotDisabled(async (context) => {
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
})
