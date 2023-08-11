import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { TicketForm } from '@condo/domains/ticket/components/TicketForm'

const TicketUpdatePage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'ticket.index.EditTicketModalTitle' })
    const { query } = useRouter()

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 20]} style={{ height: '100%' }}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <TicketForm id={query.id as string}/>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketUpdatePage.requiredAccess = OrganizationRequired

export default TicketUpdatePage
