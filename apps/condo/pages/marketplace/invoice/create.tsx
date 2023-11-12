import { Typography, Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { InvoiceForm } from '@condo/domains/marketplace/components/Invoice/InvoiceForm'


const CREATE_INVOICE_PAGE_GUTTER: [Gutter, Gutter] = [12, 60]

const CreateInvoicePage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.title' })

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

export default CreateInvoicePage