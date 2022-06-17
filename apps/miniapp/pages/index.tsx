import { useIntl } from '@core/next/intl'
import { PageContent, PageHeader, PageWrapper } from '@miniapp/domains/common/components/BaseLayout'
import { useOidcAuth } from '@miniapp/domains/common/utils/oidcAuth'
import { useOrganization } from '@miniapp/domains/common/utils/organization'
import { Typography } from 'antd'
import { get } from 'lodash'
import Head from 'next/head'

const IndexPage = () => {
    const intl = useIntl()
    const auth = useOidcAuth()
    const organizationData = useOrganization()

    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })
    const userDataMsg = intl.formatMessage({ id: 'UserData' })
    const organizationDataMsg = intl.formatMessage({ id: 'OrganizationData' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={PageTitleMsg}/>
                <PageContent>
                    <Typography.Paragraph>
                        {userDataMsg}:
                        <Typography.Text code>
                            {get(auth, 'user.name', '-')}
                        </Typography.Text>
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                        {organizationDataMsg}:
                        <Typography.Text code>
                            {get(organizationData, 'organization.name', '-')}
                        </Typography.Text>
                    </Typography.Paragraph>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default IndexPage
