import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import {
    TicketSubmittingSettingsForm,
} from '@condo/domains/settings/components/ticketSubmitting/TicketSubmittingSettingsForm'
import { MobileFeatureConfig } from '@condo/domains/settings/utils/clientSchema'

const ROW_GUTTER: [Gutter, Gutter] = [0, 60]

const TicketSubmittingContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.mobileFeatureConfig.submittingPeriod.pageTitle' })
    
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const { obj: mobileConfig, loading } = MobileFeatureConfig.useObject({
        where: {
            organization: { id: userOrganizationId },
        },
    })
    return (loading ? <></> :
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
            <Row gutter={ROW_GUTTER}>
                <Col span={24}>
                    <TicketSubmittingSettingsForm mobileConfig={mobileConfig} userOrganizationId={userOrganizationId}/>
                </Col>
            </Row>
        </>
    )
}

const TicketSubmittingPage: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.pageTitle' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <TicketSubmittingContent />
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default TicketSubmittingPage
