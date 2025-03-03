import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageComponentType } from '@condo/domains/common/types'
import { MarketSettingAbout } from '@condo/domains/marketplace/components/MarketSetting/MarketSettingAbout'
import { MarketSettingForm } from '@condo/domains/marketplace/components/MarketSetting/MarketSettingForm'
import { MarketSetting } from '@condo/domains/marketplace/utils/clientSchema'
import {
    MarketSettingReadPermissionRequired,
} from '@condo/domains/settings/components/PageAccess'


const ROW_GUTTER: [Gutter, Gutter] = [0, 60]

const PaymentTypesSettingContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.marketplace.paymentTypesSetting.title' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'], null)
    const { objs: [marketSetting], loading } = MarketSetting.useObjects({
        where: {
            organization: { id: userOrganizationId },
        },
    })

    return loading ? <Loader fill size='small'/> : (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
            <Row gutter={ROW_GUTTER}>
                <Col span={24}>
                    <MarketSettingAbout />
                </Col>
                <Col span={24}>
                    <MarketSettingForm marketSetting={marketSetting} userOrganizationId={userOrganizationId} loading={loading}/>
                </Col>
            </Row>
        </>
    )
}

const PaymentTypesSettingPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.pageTitle' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <PaymentTypesSettingContent />
                </PageContent>
            </PageWrapper>
        </>
    )
}

PaymentTypesSettingPage.requiredAccess = MarketSettingReadPermissionRequired

export default PaymentTypesSettingPage
