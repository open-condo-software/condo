import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { PageContent, PageHeader, PageWrapper } from '@miniapp/domains/common/components/BaseLayout'
import { Typography } from 'antd'
import Head from 'next/head'
import ReactMarkdown from 'react-markdown'

const IndexPage = () => {
    const intl = useIntl()
    const auth = useAuth()

    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })

    return (
        <>
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
    )
}

export default IndexPage
