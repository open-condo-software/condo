import Head from 'next/head'
import { PageContent, PageHeader, PageWrapper } from './BaseLayout'
import React from 'react'
import { Typography } from 'antd'
import { Loader } from '../Loader'

interface ILoadingOrErrorPageProps {
    title: string
    loading: boolean
    error: string
}

const LoadingOrErrorPage: React.FC<ILoadingOrErrorPageProps> = ({ title, loading, error }) => {
    return <>
        <Head>
            <title>{title}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={title}/>
            <PageContent>
                {(loading) ? <Loader/> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </PageContent>
        </PageWrapper>
    </>
}

export default LoadingOrErrorPage
