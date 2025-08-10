import { ApolloError } from '@apollo/client'
import { Typography } from 'antd'
import Head from 'next/head'
import React from 'react'

import { PageContent, PageHeader, PageWrapper } from './BaseLayout'

import { Loader } from '../Loader'


interface ILoadingOrErrorPageProps {
    title?: string
    error?: string | ApolloError
    loading?: boolean
}

const LoadingOrErrorPage: React.FC<ILoadingOrErrorPageProps> = ({ title = '', loading, error }) => {
    return <>
        <Head>
            <title>{title}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={title}/>
            <PageContent>
                {(loading) ? <Loader fill size='large'/> : null}
                {(error) ? <Typography.Title>{typeof error === 'string' ? error : error.message}</Typography.Title> : null}
            </PageContent>
        </PageWrapper>
    </>
}

export default LoadingOrErrorPage
