import React, { CSSProperties, useMemo } from 'react'
import Head from 'next/head'
import { Typography } from 'antd'

import { useIntl } from '@core/next/intl'

import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { SubscriptionPane } from '@condo/domains/subscription/components/SubscriptionPane'
import { SettingsContent as TicketHintSettings } from '@condo/domains/ticket/components/TicketHint/SettingsContent'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { SettingsPageContent, SettingsTabType } from '@condo/domains/common/components/settings/SettingsPageContent'

const TITLE_STYLES: CSSProperties = { margin: 0 }

const ALWAYS_AVAILABLE_TABS = ['hint']

const SettingsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
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
            key: 'hint',
            title: HintTitle,
            content: <TicketHintSettings />,
        },
    ].filter(Boolean),
    [HintTitle, SubscriptionTitle, hasSubscriptionFeature])

    const titleContent = useMemo(() => <Typography.Title style={TITLE_STYLES}>{PageTitle}</Typography.Title>, [PageTitle])

    return (
        <>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageHeader title={titleContent}/>
                    <TablePageContent>
                        <SettingsPageContent settingsTabs={SETTINGS_TABS} availableTabs={availableTabs} />
                    </TablePageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}


export default SettingsPage
