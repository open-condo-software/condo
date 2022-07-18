import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { SettingsPageContent } from '@condo/domains/common/components/settings/SettingsPageContent'
import { SettingsTabPaneDescriptor } from '@condo/domains/common/components/settings/Tabs'
import {
    SETTINGS_TAB_CONTACT_ROLES,
    SETTINGS_TAB_PROPERTY_HINT,
    SETTINGS_TAB_SUBSCRIPTION,
} from '@condo/domains/common/constants/settingsTabs'
import { ContactRolesSettingsContent } from '@condo/domains/contact/components/contactRoles/ContactRolesSettingsContent'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { SubscriptionPane } from '@condo/domains/subscription/components/SubscriptionPane'
import {
    SettingsContent as TicketPropertyHintSettings,
} from '@condo/domains/ticket/components/TicketPropertyHint/SettingsContent'
import { useIntl } from '@core/next/intl'
import { Typography } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import React, { CSSProperties, useMemo } from 'react'
import { useOrganization } from '@core/next/organization'

const TITLE_STYLES: CSSProperties = { margin: 0 }

const ALWAYS_AVAILABLE_TABS = [SETTINGS_TAB_PROPERTY_HINT]

const SettingsPage = (): JSX.Element => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
    const HintTitle = intl.formatMessage({ id: 'Hint' })
    const SubscriptionTitle = intl.formatMessage({ id: 'Subscription' })
    const RolesTitle = intl.formatMessage({ id: 'ContactRoles' })

    const hasSubscriptionFeature = hasFeature('subscription')
    const tabKeysToDisplay = useMemo(() => {
        const result = ALWAYS_AVAILABLE_TABS
        if (hasSubscriptionFeature) result.push(SETTINGS_TAB_SUBSCRIPTION)
        return result
    }, [hasSubscriptionFeature])

    const userOrganization = useOrganization()
    const canManageContacts = useMemo(() => get(userOrganization, ['link', 'role', 'canManageContacts']), [userOrganization])

    const settingsTabs: SettingsTabPaneDescriptor[] = useMemo(
        () => [
            hasSubscriptionFeature && {
                key: SETTINGS_TAB_SUBSCRIPTION,
                title: SubscriptionTitle,
                content: <SubscriptionPane/>,
            },
            {
                key: SETTINGS_TAB_PROPERTY_HINT,
                title: HintTitle,
                content: <TicketPropertyHintSettings/>,
            },
            canManageContacts && {
                key: SETTINGS_TAB_CONTACT_ROLES,
                title: RolesTitle,
                content: <ContactRolesSettingsContent/>,
            },
        ].filter(Boolean),
        [HintTitle, SubscriptionTitle, hasSubscriptionFeature],
    )

    const titleContent = useMemo(() => (
        <Typography.Title style={TITLE_STYLES}>{PageTitle}</Typography.Title>
    ), [PageTitle])

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
                        <SettingsPageContent settingsTabs={settingsTabs} availableTabs={tabKeysToDisplay}/>
                    </TablePageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}


export default SettingsPage
