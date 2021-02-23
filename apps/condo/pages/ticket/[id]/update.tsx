import { useRouter } from 'next/router'
import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { PageContent, PageHeader, PageWrapper } from '../../../containers/BaseLayout'
import { OrganizationRequired } from '../../../containers/OrganizationRequired'
import { TicketForm } from '../../../components/TicketForm'

const TicketUpdatePage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.ticket.index.CreateTicketModalTitle' })

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
                        <TicketForm id={id as string}/>
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default TicketUpdatePage
