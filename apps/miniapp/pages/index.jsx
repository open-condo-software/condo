import React, { useEffect } from 'react'
import Head from 'next/head'
import { Typography } from 'antd'
import ReactMarkdown from 'react-markdown'
import Router from 'next/router'

import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'


import { PageContent, PageHeader, PageWrapper } from '@miniapp/domains/common/components/BaseLayout'

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })

    const auth = useAuth()
    const  { user } = auth

    useEffect(() => {
        if (!user) {
            // TODO(antonal): extract this route to constant
            Router.push('/oidc/auth')
        }
    }, [user])

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={PageTitleMsg}/>
            <PageContent>
                <Typography.Paragraph>
                    <ReactMarkdown source={JSON.stringify(auth)}/>
                </Typography.Paragraph>
            </PageContent>
        </PageWrapper>
    </>
}

export default IndexPage
