import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PropertyScopeSettingsContent } from '@condo/domains/scope/components/PropertyScopeSettingsContent'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'

const PropertyScopesPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.title' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <PropertyScopeSettingsContent />
                </PageContent>
            </PageWrapper>
        </>
    )
}

PropertyScopesPage.requiredAccess = SettingsReadPermissionRequired

export default PropertyScopesPage