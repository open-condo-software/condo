import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import {
    AuthenticatedUserDocument,
    GetActiveOrganizationEmployeeDocument,
    useGetBillingIntegrationOrganizationContextsWithLastReportQuery,
    useGetProcessingTasksQuery,
} from '@app/condo/gql'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import esES from 'antd/lib/locale/es_ES'
import ruRU from 'antd/lib/locale/ru_RU'
import { setCookie } from 'cookies-next'
import dayjs from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import { NextPage, NextPageContext } from 'next'
import App, { AppContext } from 'next/app'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { Fragment, useMemo, useEffect } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useFeatureFlags, FeaturesReady, withFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import * as AllIcons from '@open-condo/icons'
import { extractReqLocale } from '@open-condo/locales/extractReqLocale'
import { isSSR } from '@open-condo/miniapp-utils'
import { withApollo } from '@open-condo/next/apollo'
import { useAuth, withAuth } from '@open-condo/next/auth'
import { useIntl, withIntl } from '@open-condo/next/intl'
import { useOrganization, withOrganization } from '@open-condo/next/organization'

import { useBankReportTaskUIInterface } from '@condo/domains/banking/hooks/useBankReportTaskUIInterface'
import { useBankSyncTaskUIInterface } from '@condo/domains/banking/hooks/useBankSyncTaskUIInterface'
import { CondoAppEventsHandler } from '@condo/domains/common/components/CondoAppEventsHandler'
import BaseLayout, { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import GoogleTagManager from '@condo/domains/common/components/containers/GoogleTagManager'
import YandexMetrika from '@condo/domains/common/components/containers/YandexMetrika'
import { HCaptchaProvider } from '@condo/domains/common/components/HCaptcha'
import { LayoutContextProvider } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import PopupSmart from '@condo/domains/common/components/PopupSmart'
import { PostMessageProvider } from '@condo/domains/common/components/PostMessageProvider'
import { ServiceProblemsAlert } from '@condo/domains/common/components/ServiceProblemsAlert'
import { Snowfall } from '@condo/domains/common/components/Snowfall'
import { TasksContextProvider } from '@condo/domains/common/components/tasks/TasksContextProvider'
import UseDeskWidget from '@condo/domains/common/components/UseDeskWidget'
import { COOKIE_MAX_AGE_IN_SEC } from '@condo/domains/common/constants/cookies'
import { SERVICE_PROVIDER_PROFILE } from '@condo/domains/common/constants/featureflags'
import {
    TOUR_CATEGORY,
    DASHBOARD_CATEGORY,
    COMMUNICATION_CATEGORY,
    PROPERTIES_CATEGORY,
    RESIDENTS_CATEGORY,
    EMPLOYEES_CATEGORY,
    MARKET_CATEGORY,
    BILLING_CATEGORY,
    METERS_CATEGORY,
    MINIAPPS_CATEGORY,
    SETTINGS_CATEGORY,
} from '@condo/domains/common/constants/menuCategories'
import { useHotCodeReload } from '@condo/domains/common/hooks/useHotCodeReload'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { PageComponentType } from '@condo/domains/common/types'
import { messagesImporter } from '@condo/domains/common/utils/clientSchema/messagesImporter'
import { apolloHelperOptions } from '@condo/domains/common/utils/next/apollo'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { nextRedirect } from '@condo/domains/common/utils/next/helpers'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import {
    useVitalCookies,
    SSRCookiesContext,
    useSSRCookiesContext,
    extractVitalCookies,
} from '@condo/domains/common/utils/next/ssr'
import { GetPrefetchedDataReturnRedirect } from '@condo/domains/common/utils/next/types'
import { nonNull } from '@condo/domains/common/utils/nonNull'
import { useContactExportTaskUIInterface } from '@condo/domains/contact/hooks/useContactExportTaskUIInterface'
import { useMeterReadingExportTaskUIInterface } from '@condo/domains/meter/hooks/useMeterReadingExportTaskUIInterface'
import { useMeterReadingsImportTaskUIInterface } from '@condo/domains/meter/hooks/useMeterReadingsImportTaskUIInterface'
import { ConnectedAppsWithIconsContextProvider, useConnectedAppsWithIconsContext } from '@condo/domains/miniapp/components/ConnectedAppsWithIconsProvider'
import { GlobalAppsContainer } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsContainer'
import { GlobalAppsFeaturesProvider } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import {
    useNewsItemRecipientsExportTaskUIInterface,
} from '@condo/domains/news/hooks/useNewsItemRecipientsExportTaskUIInterface'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'
import { TourProvider } from '@condo/domains/onboarding/contexts/TourContext'
import { useNoOrganizationToolTip } from '@condo/domains/onboarding/hooks/useNoOrganizationToolTip'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'
import { SubscriptionAccessGuard } from '@condo/domains/subscription/components'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { ActiveCallContextProvider } from '@condo/domains/ticket/contexts/ActiveCallContext'
import { TicketVisibilityContextProvider } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { useIncidentExportTaskUIInterface } from '@condo/domains/ticket/hooks/useIncidentExportTaskUIInterface'
import {
    useTicketDocumentGenerationTaskUIInterface,
} from '@condo/domains/ticket/hooks/useTicketDocumentGenerationTaskUIInterface'
import { useTicketExportTaskUIInterface } from '@condo/domains/ticket/hooks/useTicketExportTaskUIInterface'
import { CookieAgreement } from '@condo/domains/user/components/CookieAgreement'
import { SudoTokenProvider } from '@condo/domains/user/components/SudoTokenProvider'
import { WAS_AUTHENTICATED_COOKIE_NAME } from '@condo/domains/user/constants/auth'

import Error404Page from './404'
import Error429Page from './429'
import Error500Page from './500'

import 'antd/dist/antd.less'
import 'react-phone-input-2/lib/style.css'
import '@condo/domains/common/components/wdyr'
import '@open-condo/ui/dist/styles.min.css'
import '@open-condo/ui/dist/style-vars/variables.css'
import '@condo/domains/common/components/containers/global-styles.css'
import '@open-condo/next/logging/patchConsoleLogMethods'


const { publicRuntimeConfig: { defaultLocale, sppConfig, isDisabledSsr } } = getConfig()

const emotionCache = createCache({ key: 'css', prepend: true })

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
    es: esES,
}

interface IMenuItemData {
    id?: string
    path: string
    icon: React.FC
    label: string
    access?: boolean
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

const MenuItems: React.FC = () => {
    const { updateContext, useFlag } = useFeatureFlags()
    const isSPPOrg = useFlag(SERVICE_PROVIDER_PROFILE)
    const { persistor } = useCachePersistor()

    const { isAuthenticated, isLoading } = useAuth()
    const { employee, organization } = useOrganization()
    const { hasSubscription } = useOrganizationSubscription()
    const disabled = !employee || !hasSubscription
    const { isCollapsed } = useLayoutContext()
    const { wrapElementIntoNoOrganizationToolTip } = useNoOrganizationToolTip()

    const role = employee?.role || null
    const orgId = organization?.id || null
    const orgFeatures = organization?.features || []
    const sppBillingId = sppConfig?.BillingIntegrationId || null
    const {
        data,
    } = useGetBillingIntegrationOrganizationContextsWithLastReportQuery({
        variables: {
            organization: { id: orgId },
        },
        skip: !isAuthenticated || isLoading || !orgId || !persistor,
    })
    const billingCtx = useMemo(() => data?.contexts?.filter(Boolean)[0] || null, [data?.contexts])
    const anyReceiptsLoaded = Boolean(billingCtx?.lastReport || null)
    const hasAccessToBilling = role?.canReadPayments || role?.canReadBillingReceipts || false
    const isManagingCompany = (organization?.type || MANAGING_COMPANY_TYPE) === MANAGING_COMPANY_TYPE
    const isNoServiceProviderOrganization = (organization?.type || MANAGING_COMPANY_TYPE) !== SERVICE_PROVIDER_TYPE
    const hasAccessToTickets = role?.canReadTickets || false
    const hasAccessToIncidents = role?.canReadIncidents || false
    const hasAccessToEmployees = role?.canReadEmployees || false
    const hasAccessToProperties = role?.canReadProperties || false
    const hasAccessToContacts = role?.canReadContacts || false
    const hasAccessToAnalytics = role?.canReadAnalytics
    const hasAccessToMeters = role?.canReadMeters || false
    const hasAccessToServices = role?.canReadServices || false
    const hasAccessToSettings = role?.canReadSettings || false
    const hasAccessToMarketplace = role?.canReadMarketItems || role?.canReadInvoices || role?.canReadPaymentsWithInvoices || false
    const hasAccessToTour = role?.canReadTour || false

    const { canRead: hasAccessToNewsItems } = useNewsItemsAccess()

    const { appsByCategories, connectedAppsIds } = useConnectedAppsWithIconsContext()

    useDeepCompareEffect(() => {
        updateContext({ orgFeatures })
    }, [updateContext, orgFeatures])

    const menuCategoriesData = useMemo<Array<IMenuCategoryData>>(() => ([
        {
            key: TOUR_CATEGORY,
            items: [
                {
                    id: 'menu-item-tour',
                    path: 'tour',
                    icon: AllIcons['Guide'],
                    label: 'global.section.tour',
                    access: hasAccessToTour && isManagingCompany,
                },
            ].filter(checkItemAccess),
        },
        {
            key: DASHBOARD_CATEGORY,
            items: [
                {
                    id: 'menu-item-reports',
                    path: 'reports',
                    icon: AllIcons['BarChartVertical'],
                    label: 'global.section.analytics',
                    access: hasAccessToAnalytics && isManagingCompany,
                },
            ].filter(checkItemAccess),
        },
        {
            key: COMMUNICATION_CATEGORY,
            items: [
                {
                    id: 'menu-item-ticket',
                    path: 'ticket',
                    icon: AllIcons['NewAppeal'],
                    label: 'global.section.controlRoom',
                    access: isManagingCompany && hasAccessToTickets,
                },
                {
                    id: 'menu-item-incident',
                    path: 'incident',
                    icon: AllIcons['OnOff'],
                    label: 'global.section.incidents',
                    access: isManagingCompany && hasAccessToIncidents,
                },
                {
                    id: 'menu-item-news',
                    path: 'news',
                    icon: AllIcons['Newspaper'],
                    label: 'global.section.newsItems',
                    access: hasAccessToNewsItems,
                },
            ].filter(checkItemAccess),
        },
        {
            key: PROPERTIES_CATEGORY,
            items: [
                {
                    id: 'menu-item-property',
                    path: 'property',
                    icon: AllIcons['Building'],
                    label: 'global.section.properties',
                    access: hasAccessToProperties,
                },
            ].filter(checkItemAccess),
        },
        {
            key: RESIDENTS_CATEGORY,
            items: [
                {
                    id: 'menu-item-contact',
                    path: 'contact',
                    icon: AllIcons['Contacts'],
                    label: 'global.section.contacts',
                    access: isManagingCompany && hasAccessToContacts,
                },
            ].filter(checkItemAccess),
        },
        {
            key: EMPLOYEES_CATEGORY,
            items: [
                {
                    id: 'menu-item-employee',
                    path: 'employee',
                    icon: AllIcons['Employee'],
                    label: 'global.section.employees',
                    access: hasAccessToEmployees,
                },
            ].filter(checkItemAccess),
        },
        {
            key: MARKET_CATEGORY,
            items: [
                {
                    id: 'menu-item-marketplace',
                    path: 'marketplace',
                    icon: AllIcons['Market'],
                    label: 'global.section.marketplace',
                    access: hasAccessToMarketplace && isNoServiceProviderOrganization,
                },
            ].filter(checkItemAccess),
        },
        {
            key: BILLING_CATEGORY,
            items: [
                {
                    id: 'menu-item-billing',
                    path: 'billing',
                    icon: AllIcons['Wallet'],
                    label: 'global.section.accrualsAndPayments',
                    // NOTE: For SPP users billing is available after first receipts-load finished
                    access: isSPPOrg
                        ? hasAccessToBilling && anyReceiptsLoaded
                        : hasAccessToBilling,
                },
                {
                    id: 'menu-item-service-provider-profile',
                    path: 'service-provider-profile',
                    icon: AllIcons['Sber'],
                    label: 'global.section.SPP',
                    access: hasAccessToBilling && sppBillingId && isSPPOrg,
                },
            ].filter(checkItemAccess),
        },
        {
            key: METERS_CATEGORY,
            items: [
                {
                    id: 'menu-item-meter',
                    path: 'meter',
                    icon: AllIcons['Meters'],
                    label: 'global.section.meters',
                    access: hasAccessToMeters,
                },
            ].filter(checkItemAccess),
        },
        {
            key: MINIAPPS_CATEGORY,
            items: [
                {
                    id: 'menu-item-miniapps',
                    path: 'miniapps',
                    icon: AllIcons['Services'],
                    label: 'global.section.miniapps',
                    access: hasAccessToServices && isManagingCompany,
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
                    id: 'menu-item-settings',
                    path: 'settings',
                    icon: AllIcons['Settings'],
                    label: 'global.section.settings',
                    access: hasAccessToSettings,
                },
            ].filter(checkItemAccess),
        },
    ]), [hasAccessToAnalytics, isManagingCompany, hasAccessToTickets, hasAccessToIncidents, hasAccessToNewsItems, hasAccessToProperties, hasAccessToContacts, hasAccessToEmployees, hasAccessToMarketplace, isSPPOrg, hasAccessToBilling, anyReceiptsLoaded, sppBillingId, hasAccessToMeters, hasAccessToServices, connectedAppsIds, hasAccessToSettings, hasAccessToTour, isNoServiceProviderOrganization])

    return (
        <div>
            {menuCategoriesData.map((category) => (
                <Fragment key={category.key}>
                    {category.items.map((item) => {
                        const isSubscriptionPage = item.path === 'settings'
                        const isDisabled = isSubscriptionPage ? !employee : disabled
                        
                        return (
                            <MenuItem
                                id={item.id}
                                key={`menu-item-${item.path}`}
                                path={`/${item.path}`}
                                icon={item.icon}
                                label={item.label}
                                disabled={isDisabled}
                                isCollapsed={isCollapsed}
                                excludePaths={item.excludePaths}
                            />
                        )
                    })}
                    {(appsByCategories?.[category.key] || []).map((app) => {
                        // not a ReDoS issue: running on end user browser
                        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                        const miniAppsPattern = new RegExp(`/miniapps/${app.id}/.+`)
                        return <MenuItem
                            id={`menu-item-app-${app.id}`}
                            key={`menu-item-app-${app.id}`}
                            path={`/miniapps/${app.id}`}
                            icon={AllIcons?.[app.icon] || AllIcons['QuestionCircle']}
                            label={app.name}
                            labelRaw
                            disabled={disabled}
                            isCollapsed={isCollapsed}
                            toolTipDecorator={disabled ? wrapElementIntoNoOrganizationToolTip : null}
                            excludePaths={[miniAppsPattern]}
                        />
                    })}
                </Fragment>
            ))}
        </div>
    )
}

const TasksProvider = ({ children }) => {
    const { user, isLoading: userLoading, isAuthenticated } = useAuth()
    const { organization, isLoading: organizationIsLoading } = useOrganization()
    const { persistor } = useCachePersistor()

    // Use UI interfaces for all tasks, that are supposed to be tracked
    const { TicketDocumentGenerationTask: TicketDocumentGenerationTaskUIInterface } = useTicketDocumentGenerationTaskUIInterface()
    const { TicketExportTask: TicketExportTaskUIInterface } = useTicketExportTaskUIInterface()
    const { IncidentExportTask: IncidentExportTaskUIInterface } = useIncidentExportTaskUIInterface()
    const { MeterReadingExportTask: MeterReadingExportTaskUIInterface } = useMeterReadingExportTaskUIInterface()
    const { ContactExportTask: ContactExportTaskUIInterface } = useContactExportTaskUIInterface()
    const { BankSyncTask: BankSyncTaskUIInterface } = useBankSyncTaskUIInterface()
    const { BankReportTask: BankReportTaskUIInterface } = useBankReportTaskUIInterface()
    const { MiniAppTask: MiniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const { NewsItemRecipientsExportTask: NewsItemRecipientsExportTaskUIInterface } = useNewsItemRecipientsExportTaskUIInterface()
    const { MeterReadingsImportTask: MeterReadingsImportTaskUIInterface } = useMeterReadingsImportTaskUIInterface()
    // ... another interfaces of tasks should be used here

    // Load all tasks with 'processing' status
    const { data, loading: isProcessingTasksLoading } = useGetProcessingTasksQuery({
        variables: { userId: user?.id || null, createdAtGte: dayjs().startOf('day').toISOString() },
        skip: !isAuthenticated || userLoading || organizationIsLoading || !organization || !persistor,
    })

    const { records: miniAppTasks, loading: isMiniAppTasksLoading } = MiniAppTaskUIInterface.storage.useTasks(
        { status: 'processing', today: true }, 
        userLoading ? null : user,
    )
    // ... another task records should be loaded here

    const initialTaskRecords = useMemo(
        () => [
            ...(data?.allBankAccountReportTasks?.filter(nonNull) || []),
            ...(data?.allBankSyncTasks?.filter(nonNull) || []),
            ...(data?.allContactExportTasks?.filter(nonNull) || []),
            ...(data?.allIncidentExportTasks?.filter(nonNull) || []),
            ...(data?.allMeterReadingExportTasks?.filter(nonNull) || []),
            ...(data?.allMeterReadingsImportTasks?.filter(nonNull) || []),
            ...(data?.allNewsItemRecipientsExportTasks?.filter(nonNull) || []),
            ...(data?.allTicketDocumentGenerationTasks?.filter(nonNull) || []),
            ...(data?.allTicketExportTasks?.filter(nonNull) || []),
            ...miniAppTasks,
        ],
        [data, miniAppTasks],
    )
    const uiInterfaces = useMemo(() => ({
        MiniAppTask: MiniAppTaskUIInterface,
        TicketDocumentGenerationTask: TicketDocumentGenerationTaskUIInterface,
        TicketExportTask: TicketExportTaskUIInterface,
        IncidentExportTask: IncidentExportTaskUIInterface,
        ContactExportTask: ContactExportTaskUIInterface,
        BankSyncTask: BankSyncTaskUIInterface,
        BankReportTask: BankReportTaskUIInterface,
        NewsItemRecipientsExportTask: NewsItemRecipientsExportTaskUIInterface,
        MeterReadingsImportTask: MeterReadingsImportTaskUIInterface,
        MeterReadingExportTask: MeterReadingExportTaskUIInterface,
    }), [MiniAppTaskUIInterface, TicketDocumentGenerationTaskUIInterface, TicketExportTaskUIInterface, IncidentExportTaskUIInterface, ContactExportTaskUIInterface, BankSyncTaskUIInterface, BankReportTaskUIInterface, NewsItemRecipientsExportTaskUIInterface, MeterReadingsImportTaskUIInterface, MeterReadingExportTaskUIInterface])

    const isInitialLoading =
        !user?.id
        || (isProcessingTasksLoading || !data)
        || isMiniAppTasksLoading

    return (
        <TasksContextProvider
            preloadedTaskRecords={initialTaskRecords}
            uiInterfaces={uiInterfaces}
            isInitialLoading={isInitialLoading}
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
    const { user, isAuthenticated, isLoading: isUserLoading } = useAuth()
    const { publicRuntimeConfig: { yandexMetrikaID, popupSmartConfig, UseDeskWidgetId, isSnowfallDisabled, googleTagManagerId } } = getConfig()

    const { isMobileUserAgent, isSidebarCollapsed: isCollapsedCookie } = useSSRCookiesContext()
    const detectedMobileUserAgentInSSR = isMobileUserAgent === 'true'
    const initialIsCollapsed = isCollapsedCookie === 'true' ? true : isCollapsedCookie === 'false' ? false : undefined

    const LayoutComponent = Component.container || BaseLayout
    // TODO(Dimitreee): remove this mess later
    const HeaderAction = Component.headerAction
    let RequiredAccess: React.FC<React.PropsWithChildren> = React.Fragment

    if (Component.requiredAccess) {
        RequiredAccess = Component.requiredAccess
    }

    const shouldDisplayCookieAgreement = router.pathname.match(/\/auth(\/.*)?/)

    // NOTE: We remember that the client has already been authorized,
    // so that instead of opening the "/auth" page, we redirect to "/auth/signin"
    useEffect(() => {
        if (isUserLoading) return
        if (!isAuthenticated) return
        if (user) {
            setCookie(WAS_AUTHENTICATED_COOKIE_NAME, 'true', { maxAge: COOKIE_MAX_AGE_IN_SEC })
        }

    }, [isUserLoading, isAuthenticated, user])

    return (
        <>
            <Head>
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                />
            </Head>
            <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE} componentSize='large'>
                <CacheProvider value={emotionCache}>
                    <GlobalStyle/>
                    <LayoutContextProvider
                        serviceProblemsAlert={<ServiceProblemsAlert />}
                        detectedMobileUserAgentInSSR={detectedMobileUserAgentInSSR}
                        initialIsCollapsed={initialIsCollapsed}
                    >
                        {shouldDisplayCookieAgreement && <CookieAgreement/>}
                        <HCaptchaProvider>
                            <SudoTokenProvider>
                                <TasksProvider>
                                    <PostMessageProvider>
                                        <TourProvider>
                                            <GlobalAppsFeaturesProvider>
                                                <GlobalAppsContainer/>
                                                <TicketVisibilityContextProvider>
                                                    <ActiveCallContextProvider>
                                                        <ConnectedAppsWithIconsContextProvider>
                                                            <CondoAppEventsHandler/>
                                                            <LayoutComponent menuData={<MenuItems/>} headerAction={HeaderAction}>
                                                                <RequiredAccess>
                                                                    <SubscriptionAccessGuard>
                                                                        <FeaturesReady fallback={<Loader fill size='large'/>}>
                                                                            <Component {...pageProps} />
                                                                        </FeaturesReady>
                                                                    </SubscriptionAccessGuard>
                                                                </RequiredAccess>
                                                            </LayoutComponent>
                                                        </ConnectedAppsWithIconsContextProvider>
                                                    </ActiveCallContextProvider>
                                                </TicketVisibilityContextProvider>
                                            </GlobalAppsFeaturesProvider>
                                        </TourProvider>
                                    </PostMessageProvider>
                                </TasksProvider>
                            </SudoTokenProvider>
                        </HCaptchaProvider>
                        {!isSnowfallDisabled && <Snowfall />}
                    </LayoutContextProvider>
                    {yandexMetrikaID && <YandexMetrika />}
                    {googleTagManagerId && <GoogleTagManager />}
                    {!isEmpty(popupSmartConfig) && <PopupSmart />}
                    {UseDeskWidgetId && <UseDeskWidget/>}
                </CacheProvider>
            </ConfigProvider>
        </>
    )
}

type NextAppContext = (AppContext & NextPageContext) & {
    apolloClient: ApolloClient<NormalizedCacheObject>
    Component: PageComponentType
}

if (!isDisabledSsr || !isSSR()) {
    MyApp.getInitialProps = async (appContext: NextAppContext): Promise<{ pageProps: Record<string, any> }> => {
        try {
            const pageContext = appContext?.ctx
            const apolloClient = appContext.apolloClient

            if (!apolloClient) throw new Error('no appContext.apolloClient!')

            let initialProps: Record<string, any>,
                prefetchedData: Record<string, any>
            if (appContext.Component.getInitialProps && appContext.Component.getPrefetchedData) {
                throw new Error('You cannot use getInitialProps and getPrefetchedData together')
            }
            if (appContext.Component.getInitialProps) {
                ({ pageProps: initialProps } = await App.getInitialProps(appContext))
            }

            const skipUserPrefetch = appContext.Component.skipUserPrefetch || false

            let redirectToAuth: GetPrefetchedDataReturnRedirect
            let user: Parameters<PageComponentType['getPrefetchedData']>[0]['user'] = null
            if (!skipUserPrefetch) {
                ({ redirectToAuth, user } = await prefetchAuthOrRedirect(apolloClient, pageContext, '/auth'))

                const skipRedirectToAuth = appContext.Component.skipRedirectToAuth || false
                if (redirectToAuth && !skipRedirectToAuth) return await nextRedirect(pageContext, redirectToAuth.redirect)
            }

            let activeEmployee: Parameters<PageComponentType['getPrefetchedData']>[0]['activeEmployee'] = null
            if (user) {
                ({ activeEmployee } = await prefetchOrganizationEmployee({
                    apolloClient,
                    context: pageContext,
                    userId: user.id,
                }))

                if (!activeEmployee) {
                    const { asPath } = pageContext
                    let currentPath = asPath.split('?')[0]
                    if (currentPath.endsWith('/')) {
                        currentPath = currentPath.slice(0, -1)
                    }
                    const redirectPath = '/auth/organization'

                    if (currentPath !== redirectPath) {
                        const redirectFullPath = `${redirectPath}?next=${encodeURIComponent(asPath)}`

                        return await nextRedirect(pageContext, {
                            destination: redirectFullPath,
                            permanent: false,
                        })
                    }
                }
            }

            if (appContext.Component.getPrefetchedData) {
                const _prefetchedData = await appContext.Component.getPrefetchedData({
                    user, redirectToAuth, context: pageContext, apolloClient, activeEmployee,
                })

                const isValidPrefetchedData = typeof _prefetchedData === 'object'
                    && ('notFound' in _prefetchedData || 'redirect' in _prefetchedData || 'props' in _prefetchedData)
                    && Object.keys(_prefetchedData).length === 1
                if (!isValidPrefetchedData) throw new Error('getPrefetchedData() should return "notFound", "redirect" or "props"')

                if ('notFound' in _prefetchedData) {
                    if (_prefetchedData.notFound === true) {
                        prefetchedData = { statusCode: 404 }
                    }
                }
                if ('redirect' in _prefetchedData) {
                    return await nextRedirect(pageContext, _prefetchedData.redirect)
                }
                if ('props' in _prefetchedData) {
                    prefetchedData = _prefetchedData.props
                }
            }

            let pageProps: Record<string, any> = {
                ...initialProps,
                ...prefetchedData,
            }

            const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(pageContext?.req?.headers?.['user-agent'] || '')
            setCookie('isMobileUserAgent', isMobileUserAgent, { req: pageContext?.req, res: pageContext?.res });
                
            ({ props: pageProps } = extractVitalCookies(pageContext.req, pageContext.res, {
                props: pageProps,
            }))

            return { pageProps }
        } catch (error) {
            const errors = error?.cause?.result?.errors || []
            const tooManyRequests = errors?.some((error) => error?.extensions?.code === 'TOO_MANY_REQUESTS') && error?.cause?.statusCode === 400

            const { type, message, stack } = error

            console.error('Error while running MyApp.getInitialProps', { type, message, stack, tooManyRequests })

            if (tooManyRequests) {
                const timestamp = errors.reduce((max, err) => {
                    const resetTime =  err?.extensions?.messageInterpolation?.resetTime
                    if (resetTime > max) return resetTime
                    return max
                }, 0)

                return {
                    pageProps: {
                        statusCode: 429,
                        resetTime: timestamp,
                    },
                }
            }

            return { pageProps: { statusCode: 500 } }
        }
    }
}

const withCookies = () => (PageComponent: NextPage): NextPage => {
    const WithCookies = (props) => {
        const ssrCookies = useVitalCookies(props?.pageProps)

        return (
            <SSRCookiesContext.Provider value={ssrCookies}>
                <PageComponent {...props} />
            </SSRCookiesContext.Provider>
        )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName =
            PageComponent.displayName || PageComponent.name || 'Component'
        WithCookies.displayName = `withCookies(${displayName})`
    }

    WithCookies.getInitialProps = PageComponent.getInitialProps

    return WithCookies
}

const useInitialEmployeeId = () => {
    const { organizationLinkId: employeeId } = useSSRCookiesContext()
    return { employeeId }
}

const withError = () => (PageComponent: NextPage): NextPage => {
    const WithError = (props) => {
        const statusCode = props?.pageProps?.statusCode
        if (statusCode && statusCode === 404) return (
            <PageComponent {...props} Component={Error404Page} statusCode={statusCode} />
        )
        if (statusCode && statusCode === 429) return (
            <PageComponent {...props} Component={Error429Page} statusCode={statusCode} resetTime={props?.pageProps?.resetTime}/>
        )
        if (statusCode && statusCode >= 400) return (
            <PageComponent {...props} Component={Error500Page} statusCode={statusCode} />
        )

        return <PageComponent {...props} />
    }

    WithError.getInitialProps = PageComponent.getInitialProps

    return WithError
}

const withUncaughtExceptionHandler = () => (PageComponent: NextPage): NextPage => {
    const WithUncaughtExceptionHandler = (props) => {
        return <PageComponent {...props} />
    }

    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithUncaughtExceptionHandler.displayName = `withUncaughtExceptionHandler(${displayName})`
    }
    WithUncaughtExceptionHandler.getInitialProps = async (context) => {
        try {
            let childProps = {}
            if (PageComponent.getInitialProps) {
                childProps = await PageComponent.getInitialProps(context)
            }

            return { ...childProps }
        } catch (err) {
            const { type, message, stack } = err
            console.error('Uncaught exception', { type, message, stack })
            return { pageProps: { statusCode: 500 } }
        }
    }

    return WithUncaughtExceptionHandler
}

export default (
    withUncaughtExceptionHandler()(
        withCookies()(
            withApollo({ legacy: false, ssr: !isDisabledSsr, apolloHelperOptions })(
                withAuth({ legacy: false, USER_QUERY: AuthenticatedUserDocument })(
                    withIntl({ ssr: !isDisabledSsr, messagesImporter, extractReqLocale, defaultLocale })(
                        withOrganization({ legacy: false, GET_ORGANIZATION_EMPLOYEE_QUERY: GetActiveOrganizationEmployeeDocument, useInitialEmployeeId })(
                            withFeatureFlags({ ssr: !isDisabledSsr })(
                                withError()(
                                    MyApp
                                )
                            )
                        )
                    )
                )
            )
        )
    )
)
