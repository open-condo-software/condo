import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EditContactForm } from '@condo/domains/contact/components/EditContactForm'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

const ContactUpdatePage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'EditingContact' })

    return (
        <>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <EditContactForm/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

ContactUpdatePage.headerAction = (
    <ReturnBackHeaderAction
        descriptor={{ id: 'pages.condo.contact.PageTitle' }}
        path={(id) => `/contact/${id}/`}
    />
)

ContactUpdatePage.requiredAccess = OrganizationRequired

export default ContactUpdatePage
