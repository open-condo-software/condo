import { useIntl } from '@core/next/intl'
import Head from 'next/head'
import { PageContent, PageHeader, PageWrapper } from '@app/_example05app/containers/BaseLayout'
import { OrganizationRequired } from '@app/_example05app/containers/OrganizationRequired'
import { Typography } from 'antd'
import ReactMarkdown from 'react-markdown'

const BLOCK = 'Мы еще разрабатываем эту страницу, она пока не доступна'

const LibraryIndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.library.index.PageTitle' })

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

export default LibraryIndexPage
