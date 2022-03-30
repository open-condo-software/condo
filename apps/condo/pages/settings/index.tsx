import React, { useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Typography, Tabs, Tooltip, Col } from 'antd'

import { useIntl } from '@core/next/intl'

import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { SubscriptionPane } from '@condo/domains/subscription/components/SubscriptionPane'

const ALWAYS_AVAILABLE_TABS = []


const SettingsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const RolesAndAccessesTitle = intl.formatMessage({ id: 'RolesAndAccess' })
    const SubscriptionTitle = intl.formatMessage({ id: 'Subscription' })

    const hasSubscriptionFeature = hasFeature('subscription')

    const router = useRouter()
    const { tab } = parseQuery(router.query)

    const availableTabs = useMemo(() => {
        const result = ALWAYS_AVAILABLE_TABS
        if (hasSubscriptionFeature) result.push('subscription')
        return result
    }, [hasSubscriptionFeature])

    const defaultTab = availableTabs.includes(tab) ? tab : undefined

    const handleTabChange = (newKey) => {
        const newRoute = `${router.route}?tab=${newKey}`
        return router.push(newRoute)
    }

    return (
        <>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitle}</Typography.Title>}/>
                    <PageContent>
                        <Col lg={20} xs={24}>
                            <Tabs
                                defaultActiveKey={defaultTab}
                                activeKey={defaultTab}
                                tabBarStyle={{ marginBottom: 40 }}
                                style={{ overflow: 'visible' }}
                                onChange={handleTabChange}
                            >
                                {
                                    hasSubscriptionFeature && (
                                        <Tabs.TabPane
                                            key="subscription"
                                            tab={SubscriptionTitle}
                                        >
                                            <SubscriptionPane/>
                                        </Tabs.TabPane>
                                    )
                                }
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
        </>
    )
}

SettingsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.Settings' }}/>

export default SettingsPage
