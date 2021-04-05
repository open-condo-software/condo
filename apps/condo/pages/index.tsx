import Head from 'next/head'
import { Typography } from 'antd'
import React from 'react'
import ReactMarkdown from 'react-markdown'

import { useIntl } from '@core/next/intl'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const IndexPage: React.FC = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })
    const WeAreStillDevelopingThisPageMsg = intl.formatMessage({ id: 'WeAreStillDevelopingThisPage' })

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={PageTitleMsg}/>
            <PageContent>
                <OrganizationRequired>
                    <Typography.Paragraph>
                        <ReactMarkdown source={WeAreStillDevelopingThisPageMsg}/>
                    </Typography.Paragraph>
                </OrganizationRequired>
            </PageContent>
        </PageWrapper>
    </>
}

export default IndexPage
