import { useIntl } from '@open-condo/next/intl'
import Head from 'next/head'
import { Typography } from 'antd'
import ReactMarkdown from 'react-markdown'

import { PageContent, PageHeader, PageWrapper } from '@app/condo/containers/BaseLayout'

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'index.PageTitle' })
    const WeAreStillDevelopingThisPageMsg = intl.formatMessage({ id: 'WeAreStillDevelopingThisPage' })

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={PageTitleMsg}/>
            <PageContent>
                <Typography.Paragraph>
                    <ReactMarkdown source={WeAreStillDevelopingThisPageMsg}/>
                </Typography.Paragraph>
            </PageContent>
        </PageWrapper>
    </>
}

export default IndexPage
