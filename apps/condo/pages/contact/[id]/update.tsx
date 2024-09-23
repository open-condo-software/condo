import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EditContactForm } from '@condo/domains/contact/components/EditContactForm'
import { ContactsReadAndManagePermissionRequired } from '@condo/domains/contact/components/PageAccess'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'


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

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const user = await prefetchAuth(client)

    if (!user) {
        return {
            unstable_redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        }
    }

    return extractSSRState(client, req, res, {
        props: {},
    })
}
