import React from 'react'
import Head from 'next/head'
import { Typography } from 'antd'
import { useIntl } from '@core/next/intl'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { TicketsWidget } from '@condo/domains/ticket/components/TicketsWidget'

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.analytics.index.PageTitle' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader style={{ background: 'transparent' }} title={<Typography.Title>{PageTitleMsg}</Typography.Title>}/>
                <PageContent>
                    <TicketsWidget />
                </PageContent>
            </PageWrapper>
        </>
    )
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage
