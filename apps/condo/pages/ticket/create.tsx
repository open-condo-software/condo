import { Typography, Row, Col } from 'antd'
import { TicketForm } from '@condo/domains/ticket/components/TicketForm'
import Head from 'next/head'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { PageWithAuthBoundProps } from './[id]'

const CreateTicketPage = ({ AuthBound, TicketForm: TicketFormFromProps }) => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.ticket.index.CreateTicketModalTitle' })
    const ResAuthBound = AuthBound ? AuthBound : OrganizationRequired
    const ResTicketForm = TicketFormFromProps ? TicketFormFromProps : TicketForm

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <ResAuthBound>
                    <PageContent>
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                            </Col>
                            <ResTicketForm/>
                        </Row>
                    </PageContent>
                </ResAuthBound>
            </PageWrapper>
        </>
    )
}

CreateTicketPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.AllTickets' }} path={'/ticket/'} />

export default CreateTicketPage
