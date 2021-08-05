import { Typography, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { TicketForm } from '@condo/domains/ticket/components/TicketForm'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

//TODO(nomerdvadcatpyat) убрать эту логику, тупо скопировать
const TicketUpdatePage = ({ TicketForm: TicketFormFromProps }) => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.ticket.index.EditTicketModalTitle' })
    const { query } = useRouter()
    const ResTicketForm = TicketFormFromProps ? TicketFormFromProps : TicketForm

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 40]} style={{ height: '100%' }}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <ResTicketForm id={query.id as string}/>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketUpdatePage.headerAction = <ReturnBackHeaderAction
    descriptor={{ id: 'Back' }}
    path={(id) => `/ticket/${id}/`}/>
TicketUpdatePage.requiredAccess = OrganizationRequired

export default TicketUpdatePage
