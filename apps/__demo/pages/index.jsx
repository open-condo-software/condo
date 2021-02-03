import { useIntl } from '@core/next/intl'
import Head from 'next/head'
import { PageContent, PageHeader, PageWrapper } from '@app/_example05app/containers/BaseLayout'
import { OrganizationRequired } from '@app/_example05app/containers/OrganizationRequired'
import { Typography } from 'antd'
import ReactMarkdown from 'react-markdown'

const BLOCK = 'We are still developing this page, it is not yet available'

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={PageTitleMsg}/>
            <PageContent>
                <OrganizationRequired>
                    <Typography.Paragraph>
                        <ReactMarkdown source={BLOCK}/>
                    </Typography.Paragraph>
                </OrganizationRequired>
            </PageContent>
        </PageWrapper>
    </>
}

export default IndexPage
