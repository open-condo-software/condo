import Head from 'next/head'
import { PageContent, PageHeader, PageWrapper } from './BaseLayout'
import React from 'react'
import { Typography } from 'antd'
import { useIntl } from '@core/next/intl'

interface ILoadingOrErrorPageProps {
    title: string
    loading: boolean
    error: string
}

const LoadingOrErrorPage: React.FC<ILoadingOrErrorPageProps> = ({ title, loading, error }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    return <>
        <Head>
            <title>{title}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={title}/>
            <PageContent>
                {(loading) ? <Typography.Title>{LoadingMessage}</Typography.Title> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </PageContent>
        </PageWrapper>
    </>
}

export default LoadingOrErrorPage
