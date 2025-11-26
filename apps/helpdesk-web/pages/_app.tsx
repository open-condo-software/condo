import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { AuthenticatedUserDocument, GetActiveOrganizationEmployeeDocument } from '@app/condo/gql'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import dayjs from 'dayjs'
import { NextPage, NextPageContext } from 'next'
import App, { AppContext } from 'next/app'
import getConfig from 'next/config'
import DefaultErrorPage from 'next/error'
import React, { Fragment, useMemo } from 'react'

import * as AllIcons from '@open-condo/icons'
import { extractReqLocale } from '@open-condo/locales/extractReqLocale'
import { isSSR } from '@open-condo/miniapp-utils'
import { withApollo } from '@open-condo/next/apollo'
import { useAuth, withAuth } from '@open-condo/next/auth'
import { useIntl, withIntl } from '@open-condo/next/intl'
import { useOrganization, withOrganization } from '@open-condo/next/organization'

import GlobalErrorBoundary from '@condo/domains/common/components/containers/GlobalErrorBoundery'
import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import YandexMetrika from '@condo/domains/common/components/containers/YandexMetrika'
import { HCaptchaProvider } from '@condo/domains/common/components/HCaptcha'
import { LayoutContextProvider } from '@condo/domains/common/components/LayoutContext'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { PostMessageProvider } from '@condo/domains/common/components/PostMessageProvider'
import { Snowfall } from '@condo/domains/common/components/Snowfall'
import { TasksContextProvider } from '@condo/domains/common/components/tasks/TasksContextProvider'
import {

    COMMUNICATION_CATEGORY,
    DASHBOARD_CATEGORY, EMPLOYEES_CATEGORY,
    MINIAPPS_CATEGORY, RESIDENTS_CATEGORY, SETTINGS_CATEGORY,

} from '@condo/domains/common/constants/menuCategories'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { nextRedirect } from '@condo/domains/common/utils/next/helpers'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import {
    extractVitalCookies,
    SSRCookiesContext,
    useSSRCookiesContext,
    useVitalCookies,
} from '@condo/domains/common/utils/next/ssr'
import { GetPrefetchedDataReturnRedirect } from '@condo/domains/common/utils/next/types'
import { nonNull } from '@condo/domains/common/utils/nonNull'
import { useConnectedAppsWithIconsContext } from '@condo/domains/miniapp/components/ConnectedAppsWithIconsProvider'
import { GlobalAppsContainer } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsContainer'
import { GlobalAppsFeaturesProvider } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import { useNoOrganizationToolTip } from '@condo/domains/onboarding/hooks/useNoOrganizationToolTip'
import { MANAGING_COMPANY_TYPE } from '@condo/domains/organization/constants/common'
import { ActiveCallContextProvider } from '@condo/domains/ticket/contexts/ActiveCallContext'
import { TicketVisibilityContextProvider } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import {
    useTicketDocumentGenerationTaskUIInterface,
} from '@condo/domains/ticket/hooks/useTicketDocumentGenerationTaskUIInterface'
import { useTicketExportTaskUIInterface } from '@condo/domains/ticket/hooks/useTicketExportTaskUIInterface'
import { SudoTokenProvider } from '@condo/domains/user/components/SudoTokenProvider'
import BaseLayout from '@helpdesk-web/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@helpdesk-web/domains/common/types'
import { messagesImporter } from '@helpdesk-web/domains/common/utils/messagesImporter'
import { apolloHelperOptions } from '@helpdesk-web/domains/common/utils/next/apollo'

import { useGetProcessingTasksQuery } from '../gql'

import 'antd/dist/antd.less'
import '@open-condo/ui/dist/styles.min.css'
import '@open-condo/ui/dist/style-vars/variables.css'
import '@condo/domains/common/components/containers/global-styles.css'


const {
    publicRuntimeConfig: {
        defaultLocale,
        isDisabledSsr,
        isSnowfallDisabled,
    },
} = getConfig()

const emotionCache = createCache({ key: 'css', prepend: true })

interface IMenuItemData {
    id?: string
    path: string
    icon: React.FC
    label: string
    access?: boolean
    excludePaths?: Array<RegExp>
}

interface IMenuCategoryData {
    key: string
    items: Array<IMenuItemData>
}

function checkItemAccess (item: IMenuItemData): boolean {
    return !('access' in item) || item.access
}

const MenuItems: React.FC = () => {
    const { isCollapsed } = useLayoutContext()
    const { employee, organization } = useOrganization()
    const role = employee?.role
    const hasAccessToTickets = role?.canReadTickets || false
    const hasAccessToContacts = role?.canReadContacts || false
    const hasAccessToEmployees = role?.canReadEmployees || false
    const hasAccessToSettings = role?.canReadSettings || false
    const hasAccessToServices = role?.canReadServices || false
    const isManagingCompany = (organization?.type || MANAGING_COMPANY_TYPE) === MANAGING_COMPANY_TYPE
    const disabled = !employee
    const hasAccessToAnalytics = role?.canReadAnalytics

    const { wrapElementIntoNoOrganizationToolTip } = useNoOrganizationToolTip()

    const { appsByCategories, connectedAppsIds } = useConnectedAppsWithIconsContext()

    const menuCategoriesData = useMemo<Array<IMenuCategoryData>>(() => ([
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

    ]), [hasAccessToAnalytics, isManagingCompany, hasAccessToTickets, hasAccessToContacts, hasAccessToEmployees, hasAccessToServices, connectedAppsIds, hasAccessToSettings])


    return (
        <div>
            {menuCategoriesData.map((category) => (
                <Fragment key={category.key}>
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

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

const ANT_DEFAULT_LOCALE = enUS

const TasksProvider = ({ children }) => {
    const { user, isLoading } = useAuth()
    // Use UI interfaces for all tasks, that are supposed to be tracked
    const { TicketDocumentGenerationTask: TicketDocumentGenerationTaskUIInterface } = useTicketDocumentGenerationTaskUIInterface()
    const { TicketExportTask: TicketExportTaskUIInterface } = useTicketExportTaskUIInterface()

    // Load all tasks with 'processing' status
    const { data, loading: isProcessingTasksLoading } = useGetProcessingTasksQuery({
        variables: { userId: user?.id || null, createdAtGte: dayjs().startOf('day').toISOString() },
        skip: !user?.id || isLoading,
    })

    const initialTaskRecords = useMemo(() => [
        ...(data?.allTicketDocumentGenerationTasks?.filter(nonNull) || []),
        ...(data?.allTicketExportTasks?.filter(nonNull) || []),
    ], [data])
    const uiInterfaces = useMemo(() => ({
        TicketDocumentGenerationTask: TicketDocumentGenerationTaskUIInterface,
        TicketExportTask: TicketExportTaskUIInterface,
    }), [TicketDocumentGenerationTaskUIInterface, TicketExportTaskUIInterface ])

    return (
        <TasksContextProvider
            preloadedTaskRecords={initialTaskRecords}
            uiInterfaces={uiInterfaces}
            isInitialLoading={isProcessingTasksLoading}
        >
            {children}
        </TasksContextProvider>
    )
}

const MyApp = ({ Component, pageProps }) => {
    const intl = useIntl()
    dayjs.locale(intl.locale)

    const LayoutComponent = Component.container || BaseLayout
    const HeaderAction = Component.headerAction
    const RequiredAccess = Component.requiredAccess || React.Fragment

    return (
        <GlobalErrorBoundary>
            <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE} componentSize='large'>
                <CacheProvider value={emotionCache}>
                    <GlobalStyle/>
                    <LayoutContextProvider>
                        <HCaptchaProvider>
                            <SudoTokenProvider>
                                <TasksProvider>
                                    <PostMessageProvider>
                                        <GlobalAppsFeaturesProvider>
                                            <TicketVisibilityContextProvider>
                                                <GlobalAppsContainer/>
                                                <ActiveCallContextProvider>
                                                    <LayoutComponent menuData={<MenuItems/>} headerAction={HeaderAction}>
                                                        <RequiredAccess>
                                                            <Component {...pageProps} />
                                                        </RequiredAccess>
                                                    </LayoutComponent>
                                                </ActiveCallContextProvider>
                                            </TicketVisibilityContextProvider>
                                        </GlobalAppsFeaturesProvider>
                                    </PostMessageProvider>
                                </TasksProvider>
                            </SudoTokenProvider>
                        </HCaptchaProvider>
                        {!isSnowfallDisabled && <Snowfall />}
                    </LayoutContextProvider>
                    <YandexMetrika/>
                </CacheProvider>
            </ConfigProvider>
        </GlobalErrorBoundary>
    )
}

type NextAppContext = (AppContext & NextPageContext) & {
    apolloClient: ApolloClient<NormalizedCacheObject>
    Component: PageComponentType
}

if (!isDisabledSsr || !isSSR()) {
    MyApp.getInitialProps = async (appContext: NextAppContext): ReturnType<PageComponentType['getInitialProps']> => {
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
                ({ redirectToAuth, user } = await prefetchAuthOrRedirect(apolloClient, pageContext))

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
                        prefetchedData = { statusCode: 404, title: 'Not found page' }
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
            };

            ({ props: pageProps } = extractVitalCookies(pageContext.req, pageContext.res, {
                props: pageProps,
            }))

            return { pageProps }
        } catch (error) {
            const errors = error?.cause?.result?.errors || []
            const tooManyRequests = errors?.some((error) => error?.extensions?.code === 'TOO_MANY_REQUESTS') && error?.cause?.statusCode === 400

            console.error('Error while running `MyApp.getInitialProps', { error, tooManyRequests })

            if (tooManyRequests) {
                const timestamp = errors.reduce((max, err) => {
                    const resetTime =  err?.extensions?.messageInterpolation?.resetTime
                    if (resetTime > max) return resetTime
                    return max
                }, 0)

                const date = new Date(timestamp * 1000)

                return {
                    pageProps: {
                        statusCode: 429,
                        title: `Access will be restored in ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
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
        if (statusCode && statusCode >= 400) return (
            <PageComponent {...props} Component={DefaultErrorPage} />
        )

        return <PageComponent {...props} />
    }

    WithError.getInitialProps = PageComponent.getInitialProps

    return WithError
}

export default (
    withCookies()(
        withApollo({ legacy: false, apolloHelperOptions })(
            withAuth({ legacy: false, USER_QUERY: AuthenticatedUserDocument })(
                withIntl({ ssr: !isDisabledSsr, messagesImporter, extractReqLocale, defaultLocale })(
                    withOrganization({ legacy: false, GET_ORGANIZATION_EMPLOYEE_QUERY: GetActiveOrganizationEmployeeDocument, useInitialEmployeeId })(
                        withError()(
                            MyApp
                        )
                    )
                )
            )
        )
    )
)
