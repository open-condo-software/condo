// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import Head from 'next/head'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'

import whyDidYouRender from '@welldone-software/why-did-you-render'

import { withApollo } from '@core/next/apollo'
import { withAuth } from '@core/next/auth'
import { withIntl } from '@core/next/intl'
import { withOrganization } from '@core/next/organization'

import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import GoogleAnalytics from '@condo/domains/common/components/containers/GoogleAnalytics'
import BehaviorRecorder from '@condo/domains/common/components/containers/BehaviorRecorder'
import BaseLayout from '@condo/domains/common/components/containers/BaseLayout'
import GlobalErrorBoundary from '@condo/domains/common/components/containers/GlobalErrorBoundery'

import { GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY } from '@condo/domains/organization/gql'
import { UserIcon } from '@condo/domains/common/components/icons/UserIcon'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { FocusElement } from '@condo/domains/common/components/Focus/FocusElement'
import { BarChartIcon } from '@condo/domains/common/components/icons/BarChart'
import { OnBoardingProgress } from '@condo/domains/common/components/icons/OnBoardingProgress'
import { OnBoarding, OnBoardingProvider } from '@condo/domains/onboarding/components/OnBoardingContext'
import { FocusContextProvider } from '../domains/common/components/Focus/FocusContextProvider'
import { SubscriptionContextProvider } from '@condo/domains/subscription/components/SubscriptionContext'
import { OnBoardingProgressIconContainer } from '@condo/domains/onboarding/components/OnBoardingProgressIconContainer'
import { ThunderboltFilled, HomeFilled } from '@ant-design/icons'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    whyDidYouRender(React, {
        logOnDifferentValues: true,
    })
}

const MenuItems: React.FC = () => (
    <>
        <FocusElement>
            <OnBoardingProgressIconContainer>
                <MenuItem
                    path={'/onboarding'}
                    icon={OnBoardingProgress}
                    label={'menu.OnBoarding'}
                />
            </OnBoardingProgressIconContainer>
        </FocusElement>
        <MenuItem
            path={'/'}
            icon={BarChartIcon}
            label={'menu.Analytics'}
        />
        <MenuItem
            path={'/ticket'}
            icon={ThunderboltFilled}
            label={'menu.ControlRoom'}
        />
        <MenuItem
            path={'/property'}
            icon={HomeFilled}
            label={'menu.Property'}
        />
        <MenuItem
            path={'/contact'}
            icon={UserIcon}
            label={'menu.Contacts'}
        />
        <MenuItem
            path={'/employee'}
            icon={UserIcon}
            label={'menu.Employees'}
        />
    </>
)

const MyApp = ({ Component, pageProps }) => {
    const LayoutComponent = Component.container || BaseLayout
    // TODO(Dimitreee): remove this mess later
    const HeaderAction = Component.headerAction

    return (
        <GlobalErrorBoundary>
            <CacheProvider value={cache}>
                <Head>
                    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
                    />
                </Head>
                <GlobalStyle/>
                <FocusContextProvider>
                    <SubscriptionContextProvider>
                        <OnBoardingProvider>
                            <LayoutComponent menuData={<MenuItems/>} headerAction={HeaderAction}>
                                <Component {...pageProps} />
                            </LayoutComponent>
                        </OnBoardingProvider>
                    </SubscriptionContextProvider>
                </FocusContextProvider>
                <GoogleAnalytics/>
                <BehaviorRecorder engine="plerdy"/>
            </CacheProvider>
        </GlobalErrorBoundary>

    )
}

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
const apolloCacheConfig = {}

const apolloClientConfig = {
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'no-cache',
        },
    },
}

export default (
    withApollo({ ssr: true, apolloCacheConfig, apolloClientConfig })(
        withIntl({ ssr: true, messagesImporter })(
            withAuth({ ssr: true })(
                withOrganization({
                    ssr: true,
                    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY: GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY,
                })(MyApp)
            )
        )
    )
)
