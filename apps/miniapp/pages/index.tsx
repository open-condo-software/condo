import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageHeader, PageWrapper } from '@miniapp/domains/common/components/BaseLayout'

const IndexPage: React.FC = () => {
    const intl = useIntl()

    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={PageTitleMsg}/>
                <PageContent>
                    Hello, world
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default IndexPage
