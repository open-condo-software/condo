import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { Dashboard } from '@condo/domains/analytics/components/Dashboard'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MANAGING_COMPANY_TYPE } from '@condo/domains/organization/constants/common'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuthOrRedirect } from '@/lib/auth'
import { prefetchOrganizationEmployee } from '@/lib/organization'
import { useOrganization } from '@/lib/organization'
import { extractSSRState } from '@/lib/ssr'

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.analytics.index.PageTitle' })

    const { organization, link } = useOrganization()

    const canReadAnalytics = get(link, [ 'role', 'canReadAnalytics'], false)
        && get(organization, 'type') === MANAGING_COMPANY_TYPE

    if (!canReadAnalytics) {
        return <AccessDeniedPage />
    }

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitleMsg}</Typography.Title>} />
                <PageContent>
                    <Dashboard organizationId={organization.id} />
                </PageContent>
            </PageWrapper>
        </>
    )
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    const { activeEmployee } = await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
}
