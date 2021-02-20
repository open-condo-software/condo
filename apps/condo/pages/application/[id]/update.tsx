import { useRouter } from 'next/router'
import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { PageContent, PageHeader, PageWrapper } from '../../../containers/BaseLayout'
import { OrganizationRequired } from '../../../containers/OrganizationRequired'
import { ApplicationForm } from '../../../components/ApplicationForm'

const ApplicationUpdatePage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.application.index.CreateApplicationModalTitle' })

    const router = useRouter()
    const { query: { id } } = router

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={PageTitleMsg}/>
                <PageContent>
                    <OrganizationRequired>
                        <ApplicationForm id={id as string}/>
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default ApplicationUpdatePage
