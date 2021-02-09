import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import Chat from '../containers/Chat'
import { PageContent, PageHeader, PageWrapper } from '../containers/BaseLayout'

const IndexPage = () => {
    const { user } = useAuth()

    const intl = useIntl()
    const WelcomeMsg = intl.formatMessage({ id: 'Welcome' }, { name: user ? user.name : 'GUEST' })

    return <>
        <Head>
            <title>{WelcomeMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={WelcomeMsg}/>
            <PageContent>
                <Chat/>
            </PageContent>
        </PageWrapper>
    </>
}

export default IndexPage
