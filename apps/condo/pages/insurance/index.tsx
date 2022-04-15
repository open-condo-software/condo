import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { IFrame, IFrameWrapper } from '@condo/domains/common/components/IFrame'
import { useIntl } from '@core/next/intl'
import { Typography } from 'antd'
import getConfig from 'next/config'
import Head from 'next/head'

const {
    publicRuntimeConfig: { insuranceAppUrl },
} = getConfig()

const IndexInsurancePage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.insurance.IndexInsurancePage.PageTitle' })
    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>}/>
                <IFrame pageUrl={`${insuranceAppUrl}`}/>
            </PageWrapper>
        </>
    )
}

export default IndexInsurancePage
