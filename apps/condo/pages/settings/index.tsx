import React from 'react'
import Head from 'next/head'
import { Typography, Tabs, Tooltip, Col } from 'antd'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIntl } from '@core/next/intl'
import { BillingChooser } from '@condo/domains/billing/components/Settings/BillingChooser'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { SubscriptionPane } from '@condo/domains/subscription/components/SubscriptionPane'

const SettingsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
    const BillingTitle = intl.formatMessage({ id: 'menu.Billing' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const RolesAndAccessesTitle = intl.formatMessage({ id: 'RolesAndAccess' })
    const SubscriptionTitle = intl.formatMessage({ id: 'Subscription' })

    const hasSubscriptionFeature = hasFeature('subscription')

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitle}</Typography.Title>} />
                    <PageContent>
                        <Col lg={20} xs={24}>
                            <Tabs defaultActiveKey="settings" tabBarStyle={{ marginBottom: 40 }} style={{ overflow: 'visible' }}>
                                {hasSubscriptionFeature && (
                                    <Tabs.TabPane key="subscription" tab={SubscriptionTitle}>
                                        <SubscriptionPane />
                                    </Tabs.TabPane>
                                )}
                                <Tabs.TabPane key={'billingChooser'} tab={BillingTitle}>
                                    <BillingChooser />
                                </Tabs.TabPane>
                                <Tabs.TabPane
                                    key="rolesAndAccess"
                                    tab={<Tooltip title={NotImplementedYetMessage}>{RolesAndAccessesTitle}</Tooltip>}
                                    disabled
                                />
                            </Tabs>
                        </Col>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

SettingsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.Settings' }} />

export default SettingsPage
