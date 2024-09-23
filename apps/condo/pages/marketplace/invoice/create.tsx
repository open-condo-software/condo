import { Typography, Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { InvoiceForm } from '@condo/domains/marketplace/components/Invoice/InvoiceForm'
import { InvoiceReadAndManagePermissionRequired } from '@condo/domains/marketplace/components/PageAccess'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'


const CREATE_INVOICE_PAGE_GUTTER: [Gutter, Gutter] = [12, 60]

const CreateInvoicePage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.create.title' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={CREATE_INVOICE_PAGE_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <InvoiceForm />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateInvoicePage.requiredAccess = InvoiceReadAndManagePermissionRequired

export default CreateInvoicePage

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
