import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import {
    SettingsContent as TicketPropertyHintSettings,
} from '@condo/domains/ticket/components/TicketPropertyHint/SettingsContent'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'

const PropertyHintsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'Hint' })

    const { link }  = useOrganization()
    const employeeId = get(link, 'id')
    usePreviousSortAndFilters({ employeeSpecificKey: employeeId })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <TicketPropertyHintSettings />
                </PageContent>
            </PageWrapper>
        </>
    )
}

PropertyHintsPage.requiredAccess = SettingsReadPermissionRequired

export default PropertyHintsPage

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
