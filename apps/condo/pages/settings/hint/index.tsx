import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import {
    SettingsContent as TicketPropertyHintSettings,
} from '@condo/domains/ticket/components/TicketPropertyHint/SettingsContent'

const PropertyHintsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'Hint' })

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