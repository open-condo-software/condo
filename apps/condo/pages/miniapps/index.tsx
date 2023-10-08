import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { CatalogPageContent } from '@condo/domains/miniapp/components/Catalog/PageContent'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

type PageType = React.FC & {
    requiredAccess: React.ReactNode
}

const MiniappsCatalogPage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.miniapps' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <CatalogPageContent/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

MiniappsCatalogPage.requiredAccess = OrganizationRequired

export default MiniappsCatalogPage
