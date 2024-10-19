import Head from 'next/head'
import React from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'


import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState } from '@condo/domains/common/utils/next/ssr'
import { EditContactForm } from '@condo/domains/contact/components/EditContactForm'
import { ContactsReadAndManagePermissionRequired } from '@condo/domains/contact/components/PageAccess'

import type { GetServerSideProps } from 'next'


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

ContactUpdatePage.requiredAccess = ContactsReadAndManagePermissionRequired

export default ContactUpdatePage

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
}
