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
import { MarketItemForm } from '@condo/domains/marketplace/components/MarketItem/MarketItemForm'
import { MarketItemReadAndManagePermissionRequired } from '@condo/domains/marketplace/components/PageAccess'
import { MarketItem } from '@condo/domains/marketplace/utils/clientSchema'


const UPDATE_INVOICE_PAGE_GUTTER: [Gutter, Gutter] = [12, 60]

const UpdateInvoicePage: PageComponentType = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const UpdateMarketItemTitle = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.update.title' })
    const NotFoundErrorTitle = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.notFoundError.title' })
    const NotFoundDescription = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.notFoundError.description' })

    const router = useRouter()
    const { organization } = useOrganization()
    const { query: { id } } = router as { query: { [key: string]: string } }
    const { obj: marketItem, loading, error } = MarketItem.useObject({
        where: {
            id,
            organization: { id: get(organization, 'id', null) },
        },
    })

    if (!marketItem && !error && !loading) {
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

    return (
        <>
            <Head>
                <title>{UpdateMarketItemTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={UPDATE_INVOICE_PAGE_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{UpdateMarketItemTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <MarketItemForm marketItem={marketItem} />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdateInvoicePage.requiredAccess = MarketItemReadAndManagePermissionRequired

export default UpdateInvoicePage
