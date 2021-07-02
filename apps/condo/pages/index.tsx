import React from 'react'
import Head from 'next/head'
import { Typography, Space } from 'antd'
import { useIntl } from '@core/next/intl'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { TicketsWidget } from '@condo/domains/ticket/components/TicketsWidget'


const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader style={{ background: 'transparent' }} title={<Typography.Title>{PageTitleMsg}</Typography.Title>}/>
                <OrganizationRequired>
                    <PageContent>
                        <TicketsWidget />
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()
    return (
        <Space>
            <Typography.Text style={{ fontSize: '12px' }}>
                {intl.formatMessage({ id: 'menu.Analytics' })}
            </Typography.Text>
        </Space>
    )
}

IndexPage.headerAction = <HeaderAction />

export default IndexPage
