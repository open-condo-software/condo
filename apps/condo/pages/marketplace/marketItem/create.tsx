import { Typography, Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'


import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState } from '@condo/domains/common/utils/next/ssr'
import { MarketItemForm } from '@condo/domains/marketplace/components/MarketItem/MarketItemForm'
import { MarketItemReadAndManagePermissionRequired } from '@condo/domains/marketplace/components/PageAccess'

import type { GetServerSideProps } from 'next'


const CREATE_MARKET_ITEM_PAGE_GUTTER: [Gutter, Gutter] = [12, 60]

const CreateInvoicePage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.create.title' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={CREATE_MARKET_ITEM_PAGE_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <MarketItemForm />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateInvoicePage.requiredAccess = MarketItemReadAndManagePermissionRequired

export default CreateInvoicePage

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
