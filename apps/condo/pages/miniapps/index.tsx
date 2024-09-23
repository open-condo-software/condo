import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { CatalogPageContent } from '@condo/domains/miniapp/components/Catalog/PageContent'
import { ServicesReadPermissionRequired } from '@condo/domains/miniapp/components/PageAccess'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'


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
