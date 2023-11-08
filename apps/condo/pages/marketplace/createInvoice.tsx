import { Typography, Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { CreateInvoiceForm } from '@condo/domains/marketplace/components/createInvoiceForm'


interface ICreateMeterPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CREATE_METER_PAGE_GUTTER: [Gutter, Gutter] = [12, 40]

const CreateMeterPage: ICreateMeterPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.createBill.title' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={CREATE_METER_PAGE_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <CreateInvoiceForm />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default CreateMeterPage