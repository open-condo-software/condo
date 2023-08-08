import { Typography } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import React, { CSSProperties, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { ControlRoomSettingsContent } from '@condo/domains/common/components/settings/ControlRoomSettingsContent'
import { MobileFeatureConfigContent } from '@condo/domains/common/components/settings/MobileFeatureConfigContent'
import { SettingsPageContent } from '@condo/domains/common/components/settings/SettingsPageContent'
import { SettingsTabPaneDescriptor } from '@condo/domains/common/components/settings/Tabs'
import { MOBILE_FEATURE_CONFIGURATION } from '@condo/domains/common/constants/featureflags'
import {
    SETTINGS_TAB_CONTACT_ROLES,
    SETTINGS_TAB_PAYMENT_DETAILS,
    SETTINGS_TAB_PROPERTY_HINT,
    SETTINGS_TAB_SUBSCRIPTION,
    SETTINGS_TAB_CONTROL_ROOM,
    SETTINGS_TAB_PROPERTY_SCOPE,
    SETTINGS_TAB_EMPLOYEE_ROLES,
    SETTINGS_TAB_MOBILE_FEATURE_CONFIG,
} from '@condo/domains/common/constants/settingsTabs'
import { ContactRolesSettingsContent } from '@condo/domains/contact/components/contactRoles/ContactRolesSettingsContent'
import { EmployeeRolesSettingsContent } from '@condo/domains/organization/components/EmployeeRolesSettingsContent'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { RecipientSettingsContent } from '@condo/domains/organization/components/Recipient/SettingsContent'
import { PropertyScopeSettingsContent } from '@condo/domains/scope/components/PropertyScopeSettingsContent'
import { SubscriptionPane } from '@condo/domains/subscription/components/SubscriptionPane'
import {
    SettingsContent as TicketPropertyHintSettings,
} from '@condo/domains/ticket/components/TicketPropertyHint/SettingsContent'


const TITLE_STYLES: CSSProperties = { margin: 0 }

const ALWAYS_AVAILABLE_TABS = [SETTINGS_TAB_PROPERTY_HINT, SETTINGS_TAB_PROPERTY_SCOPE, SETTINGS_TAB_EMPLOYEE_ROLES, SETTINGS_TAB_PAYMENT_DETAILS, SETTINGS_TAB_CONTROL_ROOM]

const SettingsPage: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.settings' })
    const HintTitle = intl.formatMessage({ id: 'Hint' })
    const SubscriptionTitle = intl.formatMessage({ id: 'Subscription' })
    const RolesTitle = intl.formatMessage({ id: 'ContactRoles' })
    const DetailsTitle = intl.formatMessage({ id: 'PaymentDetails' })
    const ControlRoomTitle = intl.formatMessage({ id: 'ControlRoom' })
    const PropertyScopeTitle = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.title' })
    const EmployeeRolesTitle = intl.formatMessage({ id: 'EmployeeRoles' })
    const MobileFeatureConfigTitle = intl.formatMessage({ id: 'pages.condo.settings.barItem.MobileFeatureConfig' })

    const hasSubscriptionFeature = hasFeature('subscription')
    const { useFlag } = useFeatureFlags()
    const hasMobileFeatureConfigurationFeature = useFlag(MOBILE_FEATURE_CONFIGURATION)
    
    const userOrganization = useOrganization()
    const canManageContactRoles = useMemo(() => get(userOrganization, ['link', 'role', 'canManageContactRoles']), [userOrganization])
    const canManageMobileFeatureConfigsRoles = useMemo(() => get(userOrganization, ['link', 'role', 'canManageContactRoles']), [userOrganization])

    const tabKeysToDisplay = useMemo(() => {
        const result = ALWAYS_AVAILABLE_TABS
        if (hasSubscriptionFeature) result.push(SETTINGS_TAB_SUBSCRIPTION)
        if (canManageContactRoles) result.push(SETTINGS_TAB_CONTACT_ROLES)
        if (canManageMobileFeatureConfigsRoles) result.push(SETTINGS_TAB_MOBILE_FEATURE_CONFIG)
        return result
    }, [hasSubscriptionFeature, canManageContactRoles])

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
            {
                key: SETTINGS_TAB_PROPERTY_SCOPE,
                title: PropertyScopeTitle,
                content: <PropertyScopeSettingsContent/>,
                eventName: 'PropertyScopeVisitIndex',
            },
            {
                key: SETTINGS_TAB_EMPLOYEE_ROLES,
                title: EmployeeRolesTitle,
                content: <EmployeeRolesSettingsContent/>,
            },
            {
                key: SETTINGS_TAB_PAYMENT_DETAILS,
                title: DetailsTitle,
                content: <RecipientSettingsContent/>,
            },
            canManageContactRoles && {
                key: SETTINGS_TAB_CONTACT_ROLES,
                title: RolesTitle,
                content: <ContactRolesSettingsContent/>,
            },
            {
                key: SETTINGS_TAB_CONTROL_ROOM,
                title: ControlRoomTitle,
                content: <ControlRoomSettingsContent/>,
            },
            canManageMobileFeatureConfigsRoles && hasMobileFeatureConfigurationFeature && {
                key: SETTINGS_TAB_MOBILE_FEATURE_CONFIG,
                title: MobileFeatureConfigTitle,
                content: <MobileFeatureConfigContent/>,
            },
        ].filter(Boolean),
        [hasSubscriptionFeature, hasMobileFeatureConfigurationFeature, SubscriptionTitle, HintTitle, PropertyScopeTitle, EmployeeRolesTitle, DetailsTitle, canManageContactRoles, RolesTitle, ControlRoomTitle, MobileFeatureConfigTitle],
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
