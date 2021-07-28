import React from 'react'
import Head from 'next/head'
import { Typography, Tabs, Tooltip } from 'antd'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '../../domains/organization/components/OrganizationRequired'

const SettingsPage =  () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
    const BillingTitle = intl.formatMessage({ id: 'menu.Billing' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const RolesAndAccessesTitle = intl.formatMessage({ id: 'RolesAndAccess' })
    return (
        <>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitle}</Typography.Title>}/>
                <OrganizationRequired>
                    <PageContent>
                        <Tabs defaultActiveKey="settings">
                            <Tabs.TabPane key="settings" tab={BillingTitle}>

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
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

SettingsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.Settings' }}/>

export default SettingsPage