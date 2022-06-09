import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { TicketHintForm } from '../../../domains/ticket/components/TicketHint/TicketHintForm'

const CreateTicketHintPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.settings.hint.newTicketHint' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 60]}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <TicketHintForm/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateTicketHintPage.requiredAccess = OrganizationRequired

export default CreateTicketHintPage
