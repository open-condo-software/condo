import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { IFrame } from '@condo/domains/common/components/IFrame'
import { useIntl } from '@core/next/intl'
import { Typography } from 'antd'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const {
    publicRuntimeConfig: { insuranceAppUrl },
} = getConfig()

const IndexInsurancePage = () => {
    const intl = useIntl()
    const router = useRouter()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.insurance.IndexInsurancePage.PageTitle' })

    useEffect(() => {
        if (!insuranceAppUrl) {
            router.replace('/404')
        }
    }, [])

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
