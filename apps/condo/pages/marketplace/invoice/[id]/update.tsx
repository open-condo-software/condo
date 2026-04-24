import { Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageComponentType } from '@condo/domains/common/types'
import { InvoiceForm } from '@condo/domains/marketplace/components/Invoice/InvoiceForm'
import {
    InvoiceReadAndManagePermissionRequired,
} from '@condo/domains/marketplace/components/PageAccess'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'


const UPDATE_INVOICE_PAGE_GUTTER: [Gutter, Gutter] = [12, 60]

const UpdateInvoicePage: PageComponentType = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const UpdateInvoiceTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.update.title' })
    const NotFoundErrorTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.notFoundError.title' })
    const NotFoundDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.notFoundError.description' })

    const router = useRouter()
    const { organization } = useOrganization()
    const { query: { id } } = router as { query: { [key: string]: string } }
    const { obj: invoice, loading, error } = Invoice.useObject({
        where: {
            id,
            organization: { id: get(organization, 'id', null) },
        },
    })

    if (!invoice && !error && !loading) {
        return (
            <LoadingOrErrorPage
                title={NotFoundErrorTitle}
                error={NotFoundDescription}
            />
        )
    }

    if (loading || error) {
        return (
            <LoadingOrErrorPage
                loading={loading}
                error={error && ServerErrorMessage}
            />
        )
    }

    const title = UpdateInvoiceTitle.replace('{number}', String(get(invoice, 'number')))

    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={UPDATE_INVOICE_PAGE_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{title}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <InvoiceForm invoice={invoice} />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdateInvoicePage.requiredAccess = InvoiceReadAndManagePermissionRequired

export default UpdateInvoicePage
