import Error from 'next/error'
import React from 'react'
import Head from 'next/head'
import { Typography, Tabs, Tooltip, Col } from 'antd'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIntl } from '@core/next/intl'
import { BillingChooser } from '@condo/domains/billing/components/Settings/BillingChooser'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { SubscriptionPane } from '@condo/domains/subscription/components/SubscriptionPane'

const SettingsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
    const BillingTitle = intl.formatMessage({ id: 'menu.Billing' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const RolesAndAccessesTitle = intl.formatMessage({ id: 'RolesAndAccess' })
    const SubscriptionTitle = intl.formatMessage({ id: 'Subscription' })

    return (
        <FeatureFlagRequired name={'subscription'} fallback={<Error statusCode={404}/>}>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitle}</Typography.Title>}/>
                    <PageContent>
                        <Col span={20}>
                            <Tabs
                                defaultActiveKey="settings"
                                tabBarStyle={{ marginBottom: 40 }}
                                style={{ overflow: 'visible' }}
                            >
                                <Tabs.TabPane
                                    key="subscription"
                                    tab={SubscriptionTitle}
                                >
                                    <SubscriptionPane/>
                                </Tabs.TabPane>
                                <FeatureFlagRequired name={'billing'}>
                                    <Tabs.TabPane
                                        key="settings" tab={BillingTitle}
                                    >
                                        <BillingChooser/>
                                    </Tabs.TabPane>
                                </FeatureFlagRequired>
                                <Tabs.TabPane
                                    key="rolesAndAccess"
                                    tab={(
                                        <Tooltip title={NotImplementedYetMessage}>
                                            {RolesAndAccessesTitle}
                                        </Tooltip>
                                    )}
                                    disabled
                                />
                            </Tabs>
                        </Col>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}

SettingsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.Settings' }}/>

export default SettingsPage