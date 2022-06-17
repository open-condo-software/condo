import { Typography, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React, { CSSProperties } from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { TicketHintForm } from '@condo/domains/ticket/components/TicketHint/TicketHintForm'

const ROW_STYLES: CSSProperties = { height: '100%' }
const TITLE_STYLES: CSSProperties = { margin: 0 }

const UpdateTicketHintPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.settings.hint.editTicketHint' })
    const { query } = useRouter()

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 20]} style={ROW_STYLES}>
                        <Col span={24}>
                            <Typography.Title level={1} style={TITLE_STYLES}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <TicketHintForm id={query.id as string}/>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdateTicketHintPage.requiredAccess = OrganizationRequired

export default UpdateTicketHintPage
