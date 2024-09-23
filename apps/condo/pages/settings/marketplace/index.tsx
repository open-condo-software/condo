import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import {
    MarketSettingPaymentTypesCard,
} from '@condo/domains/marketplace/components/MarketSetting/MarketSettingPaymentTypesCard'
import { MarketSettingReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'

const ROW_GUTTER: [Gutter, Gutter] = [0, 60]

const MarketplaceSettingsContent: React.FC = () => {
    return (
        <>
            <Col span={12}>
                <Row gutter={ROW_GUTTER}>
                    <MarketSettingPaymentTypesCard/>
                </Row>
            </Col>
        </>
    )
}

const MarketplaceSettingsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.marketplace' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <MarketplaceSettingsContent />
                </PageContent>
            </PageWrapper>
        </>
    )
}

MarketplaceSettingsPage.requiredAccess = MarketSettingReadPermissionRequired

export default MarketplaceSettingsPage

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
