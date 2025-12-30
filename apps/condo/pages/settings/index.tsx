import getConfig from 'next/config'
import Head from 'next/head'
import React, { useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { TabItem, Typography } from '@open-condo/ui'

import { AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { ControlRoomSettingsContent } from '@condo/domains/common/components/settings/ControlRoomSettingsContent'
import { MobileFeatureConfigContent } from '@condo/domains/common/components/settings/MobileFeatureConfigContent'
import { TabsPageContent } from '@condo/domains/common/components/TabsPageContent'
import { SUBSCRIPTIONS } from '@condo/domains/common/constants/featureflags'
import {
    SETTINGS_TAB_CONTACT_ROLES,
    SETTINGS_TAB_PAYMENT_DETAILS,
    SETTINGS_TAB_SUBSCRIPTION,
    SETTINGS_TAB_CONTROL_ROOM,
    SETTINGS_TAB_EMPLOYEE_ROLES,
    SETTINGS_TAB_MOBILE_FEATURE_CONFIG,
    SETTINGS_TAB_MARKETPLACE,
} from '@condo/domains/common/constants/settingsTabs'
import { PageComponentType } from '@condo/domains/common/types'
import { ContactRolesSettingsContent } from '@condo/domains/contact/components/contactRoles/ContactRolesSettingsContent'
import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import {
    EmployeeRolesSettingsContent,
} from '@condo/domains/organization/components/EmployeeRolesSettingsContent'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { RecipientSettingsContent } from '@condo/domains/organization/components/Recipient/SettingsContent'
import { MANAGING_COMPANY_TYPE } from '@condo/domains/organization/constants/common'
import { useEmployeeRolesPermissionsGroups } from '@condo/domains/organization/hooks/useEmployeeRolesPermissionsGroups'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import { SubscriptionSettingsContent } from '@condo/domains/subscription/components'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import MarketplaceSettingsPage from './marketplace'


const { publicRuntimeConfig: { enableSubscriptions } } = getConfig()

const ALWAYS_AVAILABLE_TABS = []

const SettingsPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.settings' })
    const RolesTitle = intl.formatMessage({ id: 'ContactRoles' })
    const DetailsTitle = intl.formatMessage({ id: 'PaymentDetails' })
    const ControlRoomTitle = intl.formatMessage({ id: 'ControlRoom' })
    const EmployeeRolesTitle = intl.formatMessage({ id: 'EmployeeRoles' })
    const MobileFeatureConfigTitle = intl.formatMessage({ id: 'pages.condo.settings.barItem.MobileFeatureConfig' })
    const MarketSettingTitle = intl.formatMessage({ id: 'global.section.marketplace' })
    const SubscriptionsTitle = intl.formatMessage({ id: 'Subscriptions' })

    const userOrganization = useOrganization()
    const userOrganizationId = useMemo(() => userOrganization?.organization?.id || null, [userOrganization])
    const isManagingCompany = useMemo(() => (userOrganization?.organization?.type || MANAGING_COMPANY_TYPE) === MANAGING_COMPANY_TYPE, [userOrganization])
    const canManageContactRoles = useMemo(() => userOrganization?.role?.canManageContactRoles || false, [userOrganization])
    const canManageEmployeeRoles = useMemo(() => userOrganization?.role?.canManageRoles || false, [userOrganization])
    const canManageMobileFeatureConfigsRoles = useMemo(() => userOrganization?.role?.canManageMobileFeatureConfigs || false, [userOrganization])
    const canManageMarketSettingRoles = useMemo(() => userOrganization?.role?.canManageMarketSetting || false, [userOrganization])

    const { hasSubscription, hasAvailablePlans, loading: subscriptionsLoading } = useOrganizationSubscription()
    const { useFlag } = useFeatureFlags()
    const isSubscriptionsFlagEnabled = useFlag(SUBSCRIPTIONS)
    const isSubscriptionsEnabled = !subscriptionsLoading && hasAvailablePlans && enableSubscriptions && isSubscriptionsFlagEnabled

    const { objs: [acquiringIntegrationContext], loading: acquiringIntegrationContextLoading } = AcquiringIntegrationContext.useObjects({
        where: {
            organization: { id: userOrganizationId },
            invoiceStatus: CONTEXT_FINISHED_STATUS,
        },
        first: 1,
    })

    const loading = subscriptionsLoading || acquiringIntegrationContextLoading

    const availableTabs = useMemo(() => {
        if (!hasSubscription && isSubscriptionsEnabled) return [SETTINGS_TAB_SUBSCRIPTION]
        const availableTabs = [...ALWAYS_AVAILABLE_TABS]

        if (canManageEmployeeRoles && isManagingCompany) availableTabs.push(SETTINGS_TAB_EMPLOYEE_ROLES)
        if (isManagingCompany) availableTabs.push(SETTINGS_TAB_PAYMENT_DETAILS)
        if (canManageContactRoles && isManagingCompany) availableTabs.push(SETTINGS_TAB_CONTACT_ROLES)
        if (isManagingCompany) availableTabs.push(SETTINGS_TAB_CONTROL_ROOM)
        if (canManageMobileFeatureConfigsRoles) availableTabs.push(SETTINGS_TAB_MOBILE_FEATURE_CONFIG)
        if (canManageMarketSettingRoles && Boolean(acquiringIntegrationContext) && !acquiringIntegrationContextLoading) availableTabs.push(SETTINGS_TAB_MARKETPLACE)
        if (isSubscriptionsEnabled) availableTabs.push(SETTINGS_TAB_SUBSCRIPTION)
    
        return availableTabs
    }, [hasSubscription, isSubscriptionsEnabled, canManageEmployeeRoles, isManagingCompany, canManageContactRoles, canManageMobileFeatureConfigsRoles, canManageMarketSettingRoles, acquiringIntegrationContext, acquiringIntegrationContextLoading])

    const settingsTabs: TabItem[] = useMemo(() => {
        const subscriptionTab = {
            key: SETTINGS_TAB_SUBSCRIPTION,
            label: SubscriptionsTitle,
            children: <SubscriptionSettingsContent />,
        }
            
        if (!hasSubscription && isSubscriptionsEnabled) return [subscriptionTab]

        return [
            canManageEmployeeRoles && isManagingCompany && {
                key: SETTINGS_TAB_EMPLOYEE_ROLES,
                label: EmployeeRolesTitle,
                children: <EmployeeRolesSettingsContent useEmployeeRolesTableData={useEmployeeRolesPermissionsGroups} />,
            },
            isManagingCompany && {
                key: SETTINGS_TAB_PAYMENT_DETAILS,
                label: DetailsTitle,
                children: <RecipientSettingsContent/>,
            },
            canManageContactRoles && isManagingCompany && {
                key: SETTINGS_TAB_CONTACT_ROLES,
                label: RolesTitle,
                children: <ContactRolesSettingsContent/>,
            },
            isManagingCompany && {
                key: SETTINGS_TAB_CONTROL_ROOM,
                label: ControlRoomTitle,
                children: <ControlRoomSettingsContent/>,
            },
            canManageMobileFeatureConfigsRoles && {
                key: SETTINGS_TAB_MOBILE_FEATURE_CONFIG,
                label: MobileFeatureConfigTitle,
                children: <MobileFeatureConfigContent/>,
            },
            canManageMarketSettingRoles && Boolean(acquiringIntegrationContext) && !acquiringIntegrationContextLoading && {
                key: SETTINGS_TAB_MARKETPLACE,
                label: MarketSettingTitle,
                children: <MarketplaceSettingsPage/>,
            },
            isSubscriptionsEnabled && subscriptionTab,
        ].filter(Boolean)
    }, [SubscriptionsTitle, hasSubscription, isSubscriptionsEnabled, canManageEmployeeRoles, isManagingCompany, EmployeeRolesTitle, DetailsTitle, canManageContactRoles, RolesTitle, ControlRoomTitle, canManageMobileFeatureConfigsRoles, MobileFeatureConfigTitle, canManageMarketSettingRoles, acquiringIntegrationContext, acquiringIntegrationContextLoading, MarketSettingTitle])

    const titleContent = useMemo(() => (
        <Typography.Title>{PageTitle}</Typography.Title>
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
                        {
                            loading ? 
                                <Loader /> : 
                                <TabsPageContent tabItems={settingsTabs} availableTabs={availableTabs} />
                        }
                    </TablePageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

SettingsPage.requiredAccess = SettingsReadPermissionRequired

export default SettingsPage
