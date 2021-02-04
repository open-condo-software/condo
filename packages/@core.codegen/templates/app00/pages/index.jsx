import { useIntl } from '@core/next/intl'
import Head from 'next/head'
import { Typography } from 'antd'
import ReactMarkdown from 'react-markdown'

import { PageContent, PageHeader, PageWrapper } from '@app/ex02front/containers/BaseLayout'
import { OrganizationRequired } from '@app/ex02front/containers/OrganizationRequired'

const IndexPage = () => {
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
