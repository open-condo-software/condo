import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'
import { Gutter } from 'antd/es/grid/row'

import { useIntl } from '@open-condo/next/intl'

import { TicketForm } from '@condo/domains/ticket/components/TicketForm'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const WRAPPER_GUTTER: Gutter | [Gutter, Gutter] = [0, 60]

const CreateTicketPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.ticket.index.CreateTicketModalTitle' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={WRAPPER_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <TicketForm/>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateTicketPage.requiredAccess = OrganizationRequired

export default CreateTicketPage
