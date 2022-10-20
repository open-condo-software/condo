import '@condo/domains/common/components/wdyr'
import UseDeskWidget from '@condo/domains/common/components/UseDeskWidget'
import get from 'lodash/get'

import React, { useMemo } from 'react'
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import getConfig from 'next/config'
import Head from 'next/head'
import dayjs from 'dayjs'

import { withApollo } from '@condo/next/apollo'
import { useAuth, withAuth } from '@condo/next/auth'
import { useIntl, withIntl } from '@condo/next/intl'
import { useOrganization, withOrganization } from '@condo/next/organization'

import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import GoogleAnalytics from '@condo/domains/common/components/containers/GoogleAnalytics'
import YandexMetrika from '@condo/domains/common/components/containers/YandexMetrika'
import { TrackingProvider } from '@condo/domains/common/components/TrackingContext'
import BaseLayout, { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { extractReqLocale } from '@condo/locales/extractReqLocale'
import { GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY } from '@condo/domains/organization/gql'
import { USER_QUERY } from '@condo/domains/user/gql'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { FocusElement } from '@condo/domains/common/components/Focus/FocusElement'
import { OnBoardingProgress } from '@condo/domains/common/components/icons/OnBoardingProgress'
import { OnBoardingProvider } from '@condo/domains/onboarding/components/OnBoardingContext'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { FocusContextProvider } from '@condo/domains/common/components/Focus/FocusContextProvider'
import { LayoutContextProvider } from '@condo/domains/common/components/LayoutContext'
import { OnBoardingProgressIconContainer } from '@condo/domains/onboarding/components/OnBoardingProgressIconContainer'
import { BILLING_RECEIPT_SERVICE_FIELD_NAME } from '@condo/domains/billing/constants/constants'
import { SubscriptionProvider, useServiceSubscriptionContext } from '@condo/domains/subscription/components/SubscriptionContext'
import { useEndTrialSubscriptionReminderPopup } from '@condo/domains/subscription/hooks/useEndTrialSubscriptionReminderPopup'
import { useNoOrganizationToolTip } from '@condo/domains/onboarding/hooks/useNoOrganizationToolTip'
import { messagesImporter } from '@condo/domains/common/utils/clientSchema/messagesImporter'
import { BarTicketIcon } from '@condo/domains/common/components/icons/BarTicketIcon'
import { BarEmployeeIcon } from '@condo/domains/common/components/icons/BarEmployeeIcon'
import { BarPropertyIcon } from '@condo/domains/common/components/icons/BarPropertyIcon'
import { BarUserIcon } from '@condo/domains/common/components/icons/BarUserIcon'
import { BarBillingIcon } from '@condo/domains/common/components/icons/BarBillingIcon'
import { BarPaymentsIcon } from '@condo/domains/common/components/icons/BarPaymentsIcon'
import { BarMeterIcon } from '@condo/domains/common/components/icons/BarMeterIcon'
import { BarMiniAppsIcon } from '@condo/domains/common/components/icons/BarMiniAppsIcon'
import { BarSettingIcon } from '@condo/domains/common/components/icons/BarSettingIcon'
import { BarChartIconNew } from '@condo/domains/common/components/icons/BarChartIconNew'
import { TasksContextProvider } from '@condo/domains/common/components/tasks/TasksContextProvider'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { useTicketExportTaskUIInterface } from '@condo/domains/ticket/hooks/useTicketExportTask'
import { useHotCodeReload } from '@condo/domains/common/hooks/useHotCodeReload'
import { TASK_STATUS } from '@condo/domains/common/components/tasks'
import { GlobalAppsContainer } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsContainer'
import { GlobalAppsFeaturesProvider } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import { FeatureFlagsProvider } from '@condo/featureflags/FeatureFlagsContext'


const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

interface IMenuItemData {
    path: string,
    icon: React.FC,
    label: string,
    access?: () => boolean,
}

const ANT_DEFAULT_LOCALE = enUS

const MenuItems: React.FC = () => {
    const { link } = useOrganization()
    const { isExpired } = useServiceSubscriptionContext()
    const hasSubscriptionFeature = hasFeature('subscription')
    const disabled = !link || (hasSubscriptionFeature && isExpired)
    const { isCollapsed } = useLayoutContext()
    const { wrapElementIntoNoOrganizationToolTip } = useNoOrganizationToolTip()
    const role = get(link, 'role', {})

    const menuItemsData: IMenuItemData[] = useMemo(() => {
        const itemsConfigs = [{
            path: 'reports',
            icon: BarChartIconNew,
            label: 'menu.Analytics',
        }, {
            path: 'ticket',
            icon: BarTicketIcon,
            label: 'menu.ControlRoom',
        }, {
            path: 'property',
            icon: BarPropertyIcon,
            label: 'menu.Property',
        }, {
            path: 'contact',
            icon: BarUserIcon,
            label: 'menu.Contacts',
        }, {
            path: 'employee',
            icon: BarEmployeeIcon,
            label: 'menu.Employees',
        }, {
            path: 'billing',
            icon: BarBillingIcon,
            label: 'menu.Billing',
            access: () => get(role, 'canReadBillingReceipts', false ),
        }, {
            path: 'payments',
            icon: BarPaymentsIcon,
            label: 'menu.Payments',
            access: () => get(role, 'canReadPayments', false ),
        }, {
            path: 'meter',
            icon: BarMeterIcon,
            label: 'menu.Meters',
        }, {
            path: 'miniapps',
            icon: BarMiniAppsIcon,
            label: 'menu.MiniApps',
        }]
        return itemsConfigs.filter((item) => get(item, 'access', () => true)())
    }, [link])

    return (
        <>
            <FocusElement>
                <OnBoardingProgressIconContainer>
                    <MenuItem
                        path='/onboarding'
                        icon={OnBoardingProgress}
                        label='menu.OnBoarding'
                        isCollapsed={isCollapsed}
                    />
                </OnBoardingProgressIconContainer>
            </FocusElement>
            <div>
                {menuItemsData.map((menuItemData) => (
                    <MenuItem
                        key={`menu-item-${menuItemData.path}`}
                        path={`/${menuItemData.path}`}
                        icon={menuItemData.icon}
                        label={menuItemData.label}
                        disabled={disabled}
                        isCollapsed={isCollapsed}
                        toolTipDecorator={disabled ? wrapElementIntoNoOrganizationToolTip : null}
                    />
                ))}
                <MenuItem
                    key='menu-item-settings'
                    path='/settings'
                    icon={BarSettingIcon}
                    label='menu.Settings'
                    disabled={!link}
                    isCollapsed={isCollapsed}
                />
            </div>
        </>
    )
}

const TasksProvider = ({ children }) => {
    const { user } = useAuth()
    // Use UI interfaces for all tasks, that are supposed to be tracked
    const { TicketExportTask: TicketExportTaskUIInterface } = useTicketExportTaskUIInterface()
    const { MiniAppTask: MiniAppTaskUIInterface } = useMiniappTaskUIInterface()
    // ... another interfaces of tasks should be used here

    // Load all tasks with 'processing' status
    const { records: ticketExportTasks } = TicketExportTaskUIInterface.storage.useTasks({ status: TASK_STATUS.PROCESSING, today: true }, user)
    const { records: miniAppTasks } = MiniAppTaskUIInterface.storage.useTasks({ status: TASK_STATUS.PROCESSING, today: true }, user)
    // ... another task records should be loaded here

    const initialTaskRecords = useMemo(() => [...miniAppTasks, ...ticketExportTasks], [miniAppTasks, ticketExportTasks])
    const uiInterfaces = useMemo(() => ({
        MiniAppTask: MiniAppTaskUIInterface,
        TicketExportTask: TicketExportTaskUIInterface,
    }), [MiniAppTaskUIInterface, TicketExportTaskUIInterface])

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

    const LayoutComponent = Component.container || BaseLayout
    // TODO(Dimitreee): remove this mess later
    const HeaderAction = Component.headerAction
    const RequiredAccess = Component.requiredAccess || React.Fragment

    const {
        EndTrialSubscriptionReminderPopup,
        isEndTrialSubscriptionReminderPopupVisible,
    } = useEndTrialSubscriptionReminderPopup()

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
                        <FocusContextProvider>
                            <TrackingProvider>
                                <OnBoardingProvider>
                                    <SubscriptionProvider>
                                        <TasksProvider>
                                            <GlobalAppsFeaturesProvider>
                                                <GlobalAppsContainer/>
                                                <LayoutContextProvider>
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
                                                </LayoutContextProvider>
                                            </GlobalAppsFeaturesProvider>
                                        </TasksProvider>
                                    </SubscriptionProvider>
                                </OnBoardingProvider>
                            </TrackingProvider>
                        </FocusContextProvider>
                        <GoogleAnalytics/>
                        <YandexMetrika/>
                    </FeatureFlagsProvider>
                </CacheProvider>
            </ConfigProvider>
            <UseDeskWidget/>
        </>
    )
}

const { publicRuntimeConfig: { defaultLocale  } } = getConfig()

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
        withIntl({ ssr: true, messagesImporter, extractReqLocale, defaultLocale })(
            withAuth({ ssr: true, USER_QUERY: USER_QUERY })(
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
