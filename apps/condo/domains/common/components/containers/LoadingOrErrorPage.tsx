import Head from 'next/head'
import { PageContent, PageHeader, PageWrapper } from './BaseLayout'
import React from 'react'
import { Typography } from 'antd'
import { Loader } from '../Loader'
import { ApolloError } from '@apollo/client'

interface ILoadingOrErrorPageProps {
    title: string
    error: string | ApolloError
    loading?: boolean
}

const LoadingOrErrorPage: React.FC<ILoadingOrErrorPageProps> = ({ title, loading, error }) => {
    return <>
        <Head>
            <title>{title}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={title}/>
            <PageContent>
                {(loading) ? <Loader fill size={'large'}/> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </PageContent>
        </PageWrapper>
    </>
}

export default LoadingOrErrorPage
