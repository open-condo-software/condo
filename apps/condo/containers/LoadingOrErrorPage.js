import Head from 'next/head'
import { PageContent, PageHeader, PageWrapper } from '@app/ex02front/containers/BaseLayout'
import React from 'react'
import { Typography } from 'antd'
import { useIntl } from '@core/next/intl'

function LoadingOrErrorPage ({ title, loading, error }) {
    const intl = useIntl()
    const LoadingMsg = intl.formatMessage({ id: 'Loading' })

    return <>
        <Head>
            <title>{title}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={title}/>
            <PageContent>
                {(loading) ? <Typography.Title>{LoadingMsg}</Typography.Title> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </PageContent>
        </PageWrapper>
    </>
}

export default LoadingOrErrorPage
