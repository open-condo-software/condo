import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { Dashboard } from '@condo/domains/analytics/components/Dashboard'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MANAGING_COMPANY_TYPE } from '@condo/domains/organization/constants/common'


const IndexPage: PageComponentType = () => {
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
