import Head from 'next/head'
import { Typography } from 'antd'
import ReactMarkdown from 'react-markdown'

import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'

import { PageContent, PageHeader, PageWrapper } from '@miniapp/domains/common/components/BaseLayout'

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })

    const auth = useAuth()

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={PageTitleMsg}/>
            <PageContent>
                <Typography.Paragraph>
                    <ReactMarkdown source={JSON.stringify(auth)}/>
                </Typography.Paragraph>
            </PageContent>
        </PageWrapper>
    </>
}

export default IndexPage
