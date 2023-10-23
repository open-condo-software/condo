import { CacheProvider } from '@emotion/core'
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import dayjs from 'dayjs'
import { cache } from 'emotion'
import get from 'lodash/get'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { FeatureFlagsProvider, useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import * as AllIcons from '@open-condo/icons'
import { extractReqLocale } from '@open-condo/locales/extractReqLocale'
import { withApollo } from '@open-condo/next/apollo'
import { useAuth, withAuth } from '@open-condo/next/auth'
import { useIntl, withIntl } from '@open-condo/next/intl'
import { useOrganization, withOrganization } from '@open-condo/next/organization'

import { useBankReportTaskUIInterface } from '@condo/domains/banking/hooks/useBankReportTaskUIInterface'
import { useBankSyncTaskUIInterface } from '@condo/domains/banking/hooks/useBankSyncTaskUIInterface'
import { BILLING_RECEIPT_SERVICE_FIELD_NAME } from '@condo/domains/billing/constants/constants'
import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import BaseLayout, { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import GoogleAnalytics from '@condo/domains/common/components/containers/GoogleAnalytics'
import YandexMetrika from '@condo/domains/common/components/containers/YandexMetrika'
import { FocusContextProvider } from '@condo/domains/common/components/Focus/FocusContextProvider'
import { FocusElement } from '@condo/domains/common/components/Focus/FocusElement'
import { OnBoardingProgress } from '@condo/domains/common/components/icons/OnBoardingProgress'
import { LayoutContextProvider } from '@condo/domains/common/components/LayoutContext'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import PopupSmart from '@condo/domains/common/components/PopupSmart'
import { PostMessageProvider } from '@condo/domains/common/components/PostMessageProvider'
import { TASK_STATUS } from '@condo/domains/common/components/tasks'
import { TasksContextProvider } from '@condo/domains/common/components/tasks/TasksContextProvider'
import { TrackingProvider } from '@condo/domains/common/components/TrackingContext'
import UseDeskWidget from '@condo/domains/common/components/UseDeskWidget'
import { SERVICE_PROVIDER_PROFILE } from '@condo/domains/common/constants/featureflags'
import {
    DASHBOARD_CATEGORY,
    COMMUNICATION_CATEGORY,
    PROPERTIES_CATEGORY,
    RESIDENTS_CATEGORY,
    EMPLOYEES_CATEGORY,
    BILLING_CATEGORY,
    METERS_CATEGORY,
    MINIAPPS_CATEGORY,
    SETTINGS_CATEGORY,
} from '@condo/domains/common/constants/menuCategories'
import { useHotCodeReload } from '@condo/domains/common/hooks/useHotCodeReload'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { messagesImporter } from '@condo/domains/common/utils/clientSchema/messagesImporter'
import { useContactExportTaskUIInterface } from '@condo/domains/contact/hooks/useContactExportTaskUIInterface'
import { ConnectedAppsWithIconsContextProvider, useConnectedAppsWithIconsContext } from '@condo/domains/miniapp/components/ConnectedAppsWithIconsProvider'
import { GlobalAppsContainer } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsContainer'
import { GlobalAppsFeaturesProvider } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import {
    useNewsItemRecipientsExportTaskUIInterface,
} from '@condo/domains/news/hooks/useNewsItemRecipientsExportTaskUIInterface'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'
import { OnBoardingProvider } from '@condo/domains/onboarding/components/OnBoardingContext'
import { OnBoardingProgressIconContainer } from '@condo/domains/onboarding/components/OnBoardingProgressIconContainer'
import { useNoOrganizationToolTip } from '@condo/domains/onboarding/hooks/useNoOrganizationToolTip'
import { ASSIGNED_TICKET_VISIBILITY, MANAGING_COMPANY_TYPE } from '@condo/domains/organization/constants/common'
import { GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY } from '@condo/domains/organization/gql'
import { OnlyTicketPagesAccess } from '@condo/domains/scope/components/OnlyTicketPagesAccess'
import {
    SubscriptionProvider,
    useServiceSubscriptionContext,
} from '@condo/domains/subscription/components/SubscriptionContext'
import {
    useEndTrialSubscriptionReminderPopup,
} from '@condo/domains/subscription/hooks/useEndTrialSubscriptionReminderPopup'
import { ActiveCallContextProvider } from '@condo/domains/ticket/contexts/ActiveCallContext'
import { TicketVisibilityContextProvider } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { useIncidentExportTaskUIInterface } from '@condo/domains/ticket/hooks/useIncidentExportTaskUIInterface'
import { useTicketExportTaskUIInterface } from '@condo/domains/ticket/hooks/useTicketExportTaskUIInterface'
import { CookieAgreement } from '@condo/domains/user/components/CookieAgreement'
import { USER_QUERY } from '@condo/domains/user/gql'
import '@condo/domains/common/components/wdyr'
import '@open-condo/ui/dist/styles.min.css'
import '@open-condo/ui/dist/style-vars/variables.css'
import '@condo/domains/common/components/containers/global-styles.css'

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

interface IMenuItemData {
    id?: string,
    path: string,
    icon: React.FC,
    label: string,
    access?: boolean,
    excludePaths?: Array<RegExp>
}

function checkItemAccess (item: IMenuItemData): boolean {
    return !('access' in item) || item.access
}

interface IMenuCategoryData {
    key: string
    items: Array<IMenuItemData>
}

const ANT_DEFAULT_LOCALE = enUS

const { publicRuntimeConfig: { defaultLocale, sppConfig } } = getConfig()

const MenuItems: React.FC = () => {
    const { link, organization } = useOrganization()
    const { isExpired } = useServiceSubscriptionContext()
    const hasSubscriptionFeature = hasFeature('subscription')
    const disabled = !link || (hasSubscriptionFeature && isExpired)
    const { isCollapsed } = useLayoutContext()
    const { wrapElementIntoNoOrganizationToolTip } = useNoOrganizationToolTip()
    const { updateContext, useFlag } = useFeatureFlags()
    const role = get(link, 'role', {})
    const orgId = get(organization, 'id', null)
    const orgFeatures = get(organization, 'features', [])
    const isAssignedVisibilityType = get(role, 'ticketVisibilityType') === ASSIGNED_TICKET_VISIBILITY
    const isSPPOrg = useFlag(SERVICE_PROVIDER_PROFILE)
    const sppBillingId = get(sppConfig, 'BillingIntegrationId', null)
    const { obj: billingCtx } = BillingContext.useObject({ where: { integration: { id: sppBillingId }, organization: { id: orgId } } })
    const anyReceiptsLoaded = Boolean(get(billingCtx, 'lastReport', null))
    const hasAccessToBilling = get(role, 'canReadPayments', false) || get(role, 'canReadBillingReceipts', false)
    const isManagingCompany = get(organization, 'type', MANAGING_COMPANY_TYPE) === MANAGING_COMPANY_TYPE
    const hasAccessToTickets = get(role, 'canReadTickets', false)
    const hasAccessToIncidents = get(role, 'canReadIncidents', false)
    const hasAccessToEmployees = get(role, 'canReadEmployees', false)
    const hasAccessToProperties = get(role, 'canReadProperties', false)
    const hasAccessToContacts = get(role, 'canReadContacts', false)
    const canReadAnalytics = get(role, 'canReadAnalytics', false)

    const { canRead: hasAccessToNewsItems } = useNewsItemsAccess()

    const { appsByCategories, connectedAppsIds } = useConnectedAppsWithIconsContext()

    useDeepCompareEffect(() => {
        updateContext({ orgFeatures })
    }, [updateContext, orgFeatures])

    const menuCategoriesData = useMemo<Array<IMenuCategoryData>>(() => ([
        {
            key: DASHBOARD_CATEGORY,
            items: [
                {
                    id: 'menuitem-reports',
                    path: 'reports',
                    icon: AllIcons['BarChartVertical'],
                    label: 'global.section.analytics',
                    access: !isAssignedVisibilityType && isManagingCompany && canReadAnalytics,
                },
            ].filter(checkItemAccess),
        },
        {
            key: COMMUNICATION_CATEGORY,
            items: [
                {
                    id: 'menuitem-ticket',
                    path: 'ticket',
                    icon: AllIcons['LayoutList'],
                    label: 'global.section.controlRoom',
                    access: isManagingCompany && hasAccessToTickets,
                },
                {
                    id: 'menuitem-incident',
                    path: 'incident',
                    icon: AllIcons['OnOff'],
                    label: 'global.section.incidents',
                    access: !isAssignedVisibilityType && isManagingCompany && hasAccessToIncidents,
                },
                {
                    id: 'menuitem-news',
                    path: 'news',
                    icon: AllIcons['Newspaper'],
                    label: 'global.section.newsItems',
                    access: hasAccessToNewsItems && isManagingCompany,
                },
            ].filter(checkItemAccess),
        },
        {
            key: PROPERTIES_CATEGORY,
            items: [
                {
                    id: 'menuitem-property',
                    path: 'property',
                    icon: AllIcons['Building'],
                    label: 'global.section.properties',
                    access: !isAssignedVisibilityType && isManagingCompany && hasAccessToProperties,
                },
            ].filter(checkItemAccess),
        },
        {
            key: RESIDENTS_CATEGORY,
            items: [
                {
                    id: 'menuitem-contact',
                    path: 'contact',
                    icon: AllIcons['Contacts'],
                    label: 'global.section.contacts',
                    access: !isAssignedVisibilityType && isManagingCompany && hasAccessToContacts,
                },
            ].filter(checkItemAccess),
        },
        {
            key: EMPLOYEES_CATEGORY,
            items: [
                {
                    id: 'menuitem-employee',
                    path: 'employee',
                    icon: AllIcons['Employee'],
                    label: 'global.section.employees',
                    access: !isAssignedVisibilityType && hasAccessToEmployees,
                },
            ].filter(checkItemAccess),
        },
        {
            key: BILLING_CATEGORY,
            items: [
                {
                    id: 'menuitem-billing',
                    path: 'billing',
                    icon: AllIcons['Wallet'],
                    label: 'global.section.accrualsAndPayments',
                    // NOTE: For SPP users billing is available after first receipts-load finished
                    access: isSPPOrg
                        ? hasAccessToBilling && anyReceiptsLoaded
                        : hasAccessToBilling,
                },
                {
                    id: 'menuitem-service-provider-profile',
                    path: 'service-provider-profile',
                    icon: AllIcons['Sber'],
                    label: 'global.section.SPP',
                    access: sppBillingId && isSPPOrg,
                },
            ].filter(checkItemAccess),
        },
        {
            key: METERS_CATEGORY,
            items: [
                {
                    id: 'menuitem-meter',
                    path: 'meter',
                    icon: AllIcons['Meters'],
                    label: 'global.section.meters',
                    access: !isAssignedVisibilityType && isManagingCompany,
                },
            ].filter(checkItemAccess),
        },
        {
            key: MINIAPPS_CATEGORY,
            items: [
                {
                    id: 'menuitem-miniapps',
                    path: 'miniapps',
                    icon: AllIcons['Services'],
                    label: 'global.section.miniapps',
                    access: !isAssignedVisibilityType && isManagingCompany,
                    // not a ReDoS issue: running on end user browser
                    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                    excludePaths: connectedAppsIds.map((id) => new RegExp(`/miniapps/${id}$`)),
                },
            ].filter(checkItemAccess),
        },
        {
            key: SETTINGS_CATEGORY,
            items: [
                {
                    id: 'menuitem-settings',
                    path: 'settings',
                    icon: AllIcons['Settings'],
                    label: 'global.section.settings',
                    access: !isAssignedVisibilityType && isManagingCompany,
                },
            ].filter(checkItemAccess),
        },
    ]), [isAssignedVisibilityType, isManagingCompany, hasAccessToTickets, hasAccessToIncidents, hasAccessToNewsItems, hasAccessToProperties, hasAccessToContacts, hasAccessToEmployees, isSPPOrg, hasAccessToBilling, anyReceiptsLoaded, sppBillingId, connectedAppsIds])

    return (
        <>
            {
                !isAssignedVisibilityType && isManagingCompany &&  (
                    <FocusElement>
                        <OnBoardingProgressIconContainer>
                            <MenuItem
                                id='menuitem-onboarding'
                                path='/onboarding'
                                icon={OnBoardingProgress}
                                label='global.section.onBoarding'
                                isCollapsed={isCollapsed}
                            />
                        </OnBoardingProgressIconContainer>
                    </FocusElement>
                )
            }
            <div>
                {menuCategoriesData.map((category) => (
                    <>
                        {category.items.map((item) => (
                            <MenuItem
                                id={item.id}
                                key={`menu-item-${item.path}`}
                                path={`/${item.path}`}
                                icon={item.icon}
                                label={item.label}
                                disabled={disabled}
                                isCollapsed={isCollapsed}
                                toolTipDecorator={disabled ? wrapElementIntoNoOrganizationToolTip : null}
                                excludePaths={item.excludePaths}
                            />
                        ))}
                        {get(appsByCategories, category.key, []).map((app) => {
                            // not a ReDoS issue: running on end user browser
                            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                            const miniAppsPattern = new RegExp(`/miniapps/${app.id}/.+`)
                            return <MenuItem
                                id={`menu-item-app-${app.id}`}
                                key={`menu-item-app-${app.id}`}
                                path={`/miniapps/${app.id}`}
                                icon={get(AllIcons, app.icon, AllIcons['QuestionCircle'])}
                                label={app.name}
                                labelRaw
                                disabled={disabled}
                                isCollapsed={isCollapsed}
                                toolTipDecorator={disabled ? wrapElementIntoNoOrganizationToolTip : null}
                                excludePaths={[miniAppsPattern]}
                            />
                        })}
                    </>
                ))}
            </div>
        </>
    )
}

const TasksProvider = ({ children }) => {
    const { user } = useAuth()
    // Use UI interfaces for all tasks, that are supposed to be tracked
    const { TicketExportTask: TicketExportTaskUIInterface } = useTicketExportTaskUIInterface()
    const { IncidentExportTask: IncidentExportTaskUIInterface } = useIncidentExportTaskUIInterface()
    const { ContactExportTask: ContactExportTaskUIInterface } = useContactExportTaskUIInterface()
    const { BankSyncTask: BankSyncTaskUIInterface } = useBankSyncTaskUIInterface()
    const { BankReportTask: BankReportTaskUIInterface } = useBankReportTaskUIInterface()
    const { MiniAppTask: MiniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const { NewsItemRecipientsExportTask: NewsItemRecipientsExportTaskUIInterface } = useNewsItemRecipientsExportTaskUIInterface()
    // ... another interfaces of tasks should be used here

    // Load all tasks with 'processing' status
    const { records: ticketExportTasks } = TicketExportTaskUIInterface.storage.useTasks(
        { status: TASK_STATUS.PROCESSING, today: true }, user
    )
    const { records: incidentExportTasks } = IncidentExportTaskUIInterface.storage.useTasks(
        { status: TASK_STATUS.PROCESSING, today: true }, user
    )
    const { records: contactExportTasks } = ContactExportTaskUIInterface.storage.useTasks(
        { status: TASK_STATUS.PROCESSING, today: true }, user
    )
    const { records: bankSyncTasks } = BankSyncTaskUIInterface.storage.useTasks(
        { status: TASK_STATUS.PROCESSING, today: true }, user
    )
    const { records: bankReportTasks } = BankReportTaskUIInterface.storage.useTasks(
        { status: TASK_STATUS.PROCESSING, today: true }, user
    )
    const { records: miniAppTasks } = MiniAppTaskUIInterface.storage.useTasks(
        { status: TASK_STATUS.PROCESSING, today: true }, user
    )
    const { records: newsItemRecipientsTask } = NewsItemRecipientsExportTaskUIInterface.storage.useTasks(
        { status: TASK_STATUS.PROCESSING, today: true }, user
    )
    // ... another task records should be loaded here

    const initialTaskRecords = useMemo(
        () => [...miniAppTasks, ...ticketExportTasks, ...incidentExportTasks, ...contactExportTasks, ...bankSyncTasks, ...bankReportTasks, ...newsItemRecipientsTask],
        [miniAppTasks, ticketExportTasks, incidentExportTasks, contactExportTasks, bankSyncTasks, bankReportTasks, newsItemRecipientsTask],
    )
    const uiInterfaces = useMemo(() => ({
        MiniAppTask: MiniAppTaskUIInterface,
        TicketExportTask: TicketExportTaskUIInterface,
        IncidentExportTask: IncidentExportTaskUIInterface,
        ContactExportTask: ContactExportTaskUIInterface,
        BankSyncTask: BankSyncTaskUIInterface,
        BankReportTask: BankReportTaskUIInterface,
        NewsItemRecipientsExportTask: NewsItemRecipientsExportTaskUIInterface,
    }), [MiniAppTaskUIInterface, TicketExportTaskUIInterface, IncidentExportTaskUIInterface, ContactExportTaskUIInterface, BankSyncTaskUIInterface, BankReportTaskUIInterface, NewsItemRecipientsExportTaskUIInterface])

    return (
        <TasksContextProvider
            preloadedTaskRecords={initialTaskRecords}
            uiInterfaces={uiInterfaces}
        >
            {children}
        </TasksContextProvider>
    )
}

const MyApp = ({ Component, pageProps }) => {
    const intl = useIntl()
    useHotCodeReload()
    dayjs.locale(intl.locale)
    const router = useRouter()

    const LayoutComponent = Component.container || BaseLayout
    // TODO(Dimitreee): remove this mess later
    const HeaderAction = Component.headerAction
    let RequiredAccess: React.FC = React.Fragment

    const organization = useOrganization()
    if (!Component.isError &&
        get(organization, ['link', 'role', 'ticketVisibilityType']) === ASSIGNED_TICKET_VISIBILITY &&
        router.route !== '/') {
        RequiredAccess = OnlyTicketPagesAccess
    } else if (Component.requiredAccess) {
        RequiredAccess = Component.requiredAccess
    }

    const {
        EndTrialSubscriptionReminderPopup,
        isEndTrialSubscriptionReminderPopupVisible,
    } = useEndTrialSubscriptionReminderPopup()

    const shouldDisplayCookieAgreement = router.pathname.match(/\/auth\/.*/)

    return (
        <>
            <Head>
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                />
            </Head>
            <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE} componentSize='large'>
                <CacheProvider value={cache}>
                    <FeatureFlagsProvider>
                        <GlobalStyle/>
                        {shouldDisplayCookieAgreement && <CookieAgreement/>}
                        <FocusContextProvider>
                            <LayoutContextProvider>
                                <TasksProvider>
                                    <PostMessageProvider>
                                        <TrackingProvider>
                                            <OnBoardingProvider>
                                                <SubscriptionProvider>
                                                    <GlobalAppsFeaturesProvider>
                                                        <GlobalAppsContainer/>
                                                        <TicketVisibilityContextProvider>
                                                            <ActiveCallContextProvider>
                                                                <ConnectedAppsWithIconsContextProvider>
                                                                    <LayoutComponent menuData={<MenuItems/>} headerAction={HeaderAction}>
                                                                        <RequiredAccess>
                                                                            <Component {...pageProps} />
                                                                            {
                                                                                isEndTrialSubscriptionReminderPopupVisible && (
                                                                                    <EndTrialSubscriptionReminderPopup/>
                                                                                )
                                                                            }
                                                                        </RequiredAccess>
                                                                    </LayoutComponent>
                                                                </ConnectedAppsWithIconsContextProvider>
                                                            </ActiveCallContextProvider>
                                                        </TicketVisibilityContextProvider>
                                                    </GlobalAppsFeaturesProvider>
                                                </SubscriptionProvider>
                                            </OnBoardingProvider>
                                        </TrackingProvider>
                                    </PostMessageProvider>
                                </TasksProvider>
                            </LayoutContextProvider>
                        </FocusContextProvider>
                        <GoogleAnalytics/>
                        <YandexMetrika/>
                        <PopupSmart />
                    </FeatureFlagsProvider>
                </CacheProvider>
            </ConfigProvider>
            <UseDeskWidget/>
        </>
    )
}

/*
    Configuration for `InMemoryCache` of Apollo
    Add fields, related to pagination strategies of Apollo.
    Items of some GraphQL global fields needs to be appended to list,
    when paginated, rather than to be displayed as a slice of data, —
    its like "Infinite scrolling" UI pattern. For example, fetching
    more changes of a ticket on button click.
    For those items, we need to set `concatPagination` strategy.
    https://www.apollographql.com/docs/react/pagination/core-api/
 */
const apolloCacheConfig = {
    typePolicies: {
        [BILLING_RECEIPT_SERVICE_FIELD_NAME]: {
            // avoiding of building cache from ID on client, since Service ID is not UUID and will be repeated
            keyFields: false,
        },
        BuildingSection: {
            keyFields: false,
        },
        BuildingFloor: {
            keyFields: false,
        },
        BuildingUnit: {
            keyFields: false,
        },
    },
}

const apolloClientConfig = {
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'no-cache',
        },
    },
}

export default (
    withApollo({ ssr: true, apolloCacheConfig, apolloClientConfig })(
        withAuth({ ssr: true, USER_QUERY })(
            withIntl({ ssr: true, messagesImporter, extractReqLocale, defaultLocale })(
                withOrganization({
                    ssr: true,
                    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY: GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY,
                })(
                    MyApp
                )
            )
        )
    )
)
