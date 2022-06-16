import React, { useMemo } from 'react'
import Head from 'next/head'
import { Typography } from 'antd'

import { useIntl } from '@core/next/intl'

import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { SubscriptionPane } from '@condo/domains/subscription/components/SubscriptionPane'
import { SettingsContent as TicketHintSettings } from '@condo/domains/ticket/components/TicketHint/SettingsContent'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { PageContent, SettingsTabType } from '../../domains/common/components/settings/PageContent'

const ALWAYS_AVAILABLE_TABS = ['hint']

const SettingsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
    const RolesAndAccessesTitle = intl.formatMessage({ id: 'RolesAndAccess' })
    const HintTitle = intl.formatMessage({ id: 'Hint' })
    const SubscriptionTitle = intl.formatMessage({ id: 'Subscription' })

    const hasSubscriptionFeature = hasFeature('subscription')

    const availableTabs = useMemo(() => {
        const result = ALWAYS_AVAILABLE_TABS
        if (hasSubscriptionFeature) result.push('subscription')
        return result
    }, [hasSubscriptionFeature])

    const SETTINGS_TABS: SettingsTabType[] = useMemo(() => [
        hasSubscriptionFeature && ({
            key: 'subscription',
            title: SubscriptionTitle,
            content: <SubscriptionPane />,
        }),
        {
            key: 'rolesAndAccess',
            title: RolesAndAccessesTitle,
            content: null,
        },
        {
            key: 'hint',
            title: HintTitle,
            content: <TicketHintSettings />,
        },
    ].filter(Boolean),
    [HintTitle, RolesAndAccessesTitle, SubscriptionTitle, hasSubscriptionFeature])

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
                    <TablePageContent>
                        <PageContent settingsTabs={SETTINGS_TABS} availableTabs={availableTabs} />
                    </TablePageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}


export default SettingsPage
