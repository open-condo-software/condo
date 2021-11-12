import React from 'react'
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import getConfig from 'next/config'
import { ThunderboltFilled, HomeFilled, SettingFilled, ApiFilled } from '@ant-design/icons'
import whyDidYouRender from '@welldone-software/why-did-you-render'

import { withApollo } from '@core/next/apollo'
import { withAuth } from '@core/next/auth'
import { useIntl, withIntl } from '@core/next/intl'
import { useOrganization, withOrganization } from '@core/next/organization'

import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import GoogleAnalytics from '@condo/domains/common/components/containers/GoogleAnalytics'
import BehaviorRecorder from '@condo/domains/common/components/containers/BehaviorRecorder'
import BaseLayout, { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { extractReqLocale } from '@condo/domains/common/utils/locale'
import { GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY } from '@condo/domains/organization/gql'
import { UserIcon } from '@condo/domains/common/components/icons/UserIcon'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { FocusElement } from '@condo/domains/common/components/Focus/FocusElement'
import { BarChartIcon } from '@condo/domains/common/components/icons/BarChart'
import { OnBoardingProgress } from '@condo/domains/common/components/icons/OnBoardingProgress'
import { OnBoardingProvider } from '@condo/domains/onboarding/components/OnBoardingContext'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { FocusContextProvider } from '@condo/domains/common/components/Focus/FocusContextProvider'
import { LayoutContextProvider } from '@condo/domains/common/components/LayoutContext'
import { OnBoardingProgressIconContainer } from '@condo/domains/onboarding/components/OnBoardingProgressIconContainer'
import {
    BILLING_RECEIPT_SERVICE_FIELD_NAME,
} from '@condo/domains/billing/constants'
import { MeterLog } from '@condo/domains/common/components/icons/MeterLogIcon'
import {
    SubscriptionProvider,
    useServiceSubscriptionContext,
} from '@condo/domains/subscription/components/SubscriptionContext'
import dayjs from 'dayjs'
import { useEndTrialSubscriptionReminderPopup } from '@condo/domains/subscription/hooks/useEndTrialSubscriptionReminderPopup'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    whyDidYouRender(React, {
        logOnDifferentValues: true,
    })
}

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

const ANT_DEFAULT_LOCALE = enUS

const MenuItems: React.FC = () => {
    const { link } = useOrganization()
    const { isExpired } = useServiceSubscriptionContext()
    const hasSubscriptionFeature = hasFeature('subscription')
    const disabled = !link || (hasSubscriptionFeature && isExpired)
    const { isCollapsed } = useLayoutContext()

    return (
        <>
            <FocusElement>
                <OnBoardingProgressIconContainer>
                    <MenuItem
                        path={'/onboarding'}
                        icon={OnBoardingProgress}
                        label={'menu.OnBoarding'}
                        isCollapsed={isCollapsed}
                    />
                </OnBoardingProgressIconContainer>
            </FocusElement>
            <div>
                <MenuItem
                    path={'/reports'}
                    icon={BarChartIcon}
                    label={'menu.Analytics'}
                    disabled={disabled}
                    isCollapsed={isCollapsed}
                />
                <MenuItem
                    path={'/ticket?sort=order_ASC'}
                    icon={ThunderboltFilled}
                    label={'menu.ControlRoom'}
                    disabled={disabled}
                    isCollapsed={isCollapsed}
                />
                <MenuItem
                    path={'/property'}
                    icon={HomeFilled}
                    label={'menu.Property'}
                    disabled={disabled}
                    isCollapsed={isCollapsed}
                />
                <MenuItem
                    path={'/contact'}
                    icon={UserIcon}
                    label={'menu.Contacts'}
                    disabled={disabled}
                    isCollapsed={isCollapsed}
                />
                <MenuItem
                    path={'/employee'}
                    icon={UserIcon}
                    label={'menu.Employees'}
                    disabled={disabled}
                    isCollapsed={isCollapsed}
                />
                <MenuItem
                    path={'/meter'}
                    icon={MeterLog}
                    label={'menu.Meters'}
                    disabled={disabled}
                    isCollapsed={isCollapsed}
                />
                <MenuItem
                    path={'/billing'}
                    icon={ApiFilled}
                    label={'menu.Billing'}
                    disabled={disabled}
                    isCollapsed={isCollapsed}
                />
                <MenuItem
                    path={'/settings'}
                    icon={SettingFilled}
                    label={'menu.Settings'}
                    disabled={!link}
                    isCollapsed={isCollapsed}
                />
            </div>
        </>
    )
}

const MyApp = ({ Component, pageProps }) => {
    const intl = useIntl()
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
        <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE} componentSize={'large'}>
            <CacheProvider value={cache}>
                <GlobalStyle/>
                <FocusContextProvider>
                    <OnBoardingProvider>
                        <SubscriptionProvider>
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
                        </SubscriptionProvider>
                    </OnBoardingProvider>
                </FocusContextProvider>
                <GoogleAnalytics/>
                <BehaviorRecorder engine="plerdy"/>
            </CacheProvider>
        </ConfigProvider>
    )
}

const { publicRuntimeConfig: { defaultLocale } } = getConfig()

async function messagesImporter (locale) {
    const locale_data = await import(`../lang/${locale}`)
    return { ...locale_data.default }
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
        withIntl({ ssr: true, messagesImporter, extractReqLocale, defaultLocale })(
            withAuth({ ssr: true })(
                withOrganization({
                    ssr: true,
                    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY: GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY,
                })(MyApp)
            )
        )
    )
)