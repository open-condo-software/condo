import { Typography } from 'antd'
import Head from 'next/head'
import ReactMarkdown from 'react-markdown'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@app/_example05app/containers/OrganizationRequired'
import { PageContent, PageWrapper } from '@app/_example05app/containers/BaseLayout/BaseLayout'

const BLOCK = `
# Добро пожаловать в СберХак #

Мы хотим создать маркетплейс для разработки библиотек

`

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
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
