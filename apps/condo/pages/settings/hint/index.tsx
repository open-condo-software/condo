import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { usePreviousQueryParams } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import {
    SettingsContent as TicketPropertyHintSettings,
} from '@condo/domains/ticket/components/TicketPropertyHint/SettingsContent'

const PropertyHintsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'Hint' })

    const { link }  = useOrganization()
    const employeeId = get(link, 'id')
    usePreviousQueryParams({ trackedParamNames: ['sort', 'filters'], employeeId })

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