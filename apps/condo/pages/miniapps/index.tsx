import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { CatalogPageContent } from '@condo/domains/miniapp/components/Catalog/PageContent'
import { ServicesReadPermissionRequired } from '@condo/domains/miniapp/components/PageAccess'


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

MiniappsCatalogPage.requiredAccess = ServicesReadPermissionRequired

export default MiniappsCatalogPage
