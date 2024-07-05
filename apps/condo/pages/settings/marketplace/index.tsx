import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { MarketSettingAbout } from '@condo/domains/marketplace/components/MarketSetting/MarketSettingAbout'
import { MarketSettingForm } from '@condo/domains/marketplace/components/MarketSetting/MarketSettingForm'
import { MarketSettingReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'

const ROW_GUTTER: [Gutter, Gutter] = [0, 60]

const MarketplaceSettingsContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.marketplace' })

    return (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
            <Row gutter={ROW_GUTTER}>
                <Col span={24}>
                    <MarketSettingAbout />
                </Col>
                <Col span={24}>
                    <MarketSettingForm />
                </Col>
            </Row>
        </>
    )
}

const MarketplaceSettingsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.marketplace' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <MarketplaceSettingsContent />
                </PageContent>
            </PageWrapper>
        </>
    )
}

//MarketplaceSettingsPage.requiredAccess = MarketSettingReadPermissionRequired

export default MarketplaceSettingsPage
