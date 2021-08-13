import React from 'react'
import Head from 'next/head'
import { Typography, Tabs, Tooltip, Col } from 'antd'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { BillingChooser } from '../../domains/billing/components/Settings/BillingChooser'
import { Feature } from '@condo/domains/common/components/Feature'

const SettingsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
    const BillingTitle = intl.formatMessage({ id: 'menu.Billing' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const RolesAndAccessesTitle = intl.formatMessage({ id: 'RolesAndAccess' })
    return (
        <Feature name={'settings'} fallbackUrl={'/'}>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitle}</Typography.Title>}/>
                <OrganizationRequired>
                    <PageContent>
                        <Col span={20}>
                            <Tabs
                                defaultActiveKey="settings"
                                tabBarStyle={{ marginBottom: 40 }}
                                style={{ overflow: 'visible' }}
                            >
                                <Tabs.TabPane key="settings" tab={BillingTitle}>
                                    <BillingChooser/>
                                </Tabs.TabPane>
                                <Tabs.TabPane
                                    key="rolesAndAccess"
                                    tab={(
                                        <Tooltip title={NotImplementedYetMessage}>
                                            {RolesAndAccessesTitle}
                                        </Tooltip>
                                    )}
                                    disabled />
                            </Tabs>
                        </Col>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </Feature>
    )
}

SettingsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.Settings' }}/>

export default SettingsPage