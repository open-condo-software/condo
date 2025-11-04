import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { EditContactForm } from '@condo/domains/contact/components/EditContactForm'
import { ContactsReadAndManagePermissionRequired } from '@condo/domains/contact/components/PageAccess'
import { prefetchContact } from '@condo/domains/contact/utils/next/Contact'


const ContactUpdatePage: PageComponentType = () => {
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

ContactUpdatePage.requiredAccess = ContactsReadAndManagePermissionRequired

ContactUpdatePage.getPrefetchedData = async ({ context, apolloClient }) => {
    const { query } = context
    const { id: contactId } = query as { id: string }

    await prefetchContact({ client: apolloClient, contactId })

    return {
        props: {},
    }
}

export default ContactUpdatePage
