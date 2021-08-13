import get from 'lodash/get'
import React, { createContext, useContext, useState } from 'react'
import { useAuth } from '@core/next/auth'
import { useApolloClient } from '@core/next/apollo'
import { OnBoarding, OnBoardingStep } from '../utils/clientSchema'
import { OnBoarding as IOnBoarding, OnBoardingStep as IOnBoardingStep } from '../../../schema'
import {
    Organization as OrganizationGql,
    OrganizationEmployee as OrganizationEmployeeGql,
} from '@condo/domains/organization/gql'
import { Property as PropertyGql } from '@condo/domains/property/gql'

interface OnBoardingContext {
    stepCompleted: boolean
    isLoading: boolean
    onBoarding?: IOnBoarding
    onBoardingSteps?: Array<IOnBoardingStep>
}
//
// const OnBoardingContext = createContext<OnBoardingContext>({
//
// })
//
// export const useOnBoardingContext = () => useContext(OnBoardingContext)
//
// export const OnBoardingProvider: React.FC = (props) => {
//     const { user } = useAuth()
//     const client = useApolloClient()
//
//     const { loading: onBoardingLoading, obj: onBoarding } = OnBoarding
//         .useObject({ where: { user: { id: get(user, 'id') } } })
//
//     const { loading: stepsLoading, objs: onBoardingSteps, refetch } = OnBoardingStep
//         .useObjects({ where: { onBoarding: { id: get(onBoarding, 'id') } } })
//
//     const updateAction = OnBoardingStep.useUpdate({}, () => refetch())
//
//     const onBoardingQueriesMap = {
//         'create.Organization': OrganizationGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
//         'create.Property': PropertyGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
//         'create.OrganizationEmployee': OrganizationEmployeeGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
//     }
//
//     onBoardingSteps.forEach(async (step) => {
//         const { action, entity, completed } = step
//         const key = `${action}.${entity}`
//
//         const query = onBoardingQueriesMap[key]
//
//         if (!completed && query) {
//             client.watchQuery({ query }).result().then((res) => {
//                 console.log(res)
//                 if (res.data.objs.length > 0) {
//                     updateAction({ completed: true }, step).then(() => {
//                         refetch()
//                     })
//                 }
//             })
//         }
//     })
//
//     const [stepCompleted, setStepCompleted] = useState()
//
//     return (
//         <OnBoardingContext.Provider value={{
//             stepCompleted,
//             isLoading: onBoardingLoading || stepsLoading,
//             onBoarding,
//             onBoardingSteps,
//         }}>
//             {props.children}
//         </OnBoardingContext.Provider>
//     )
// }

function craeteOnboardingContext (name, defaultValue = {}) {
    const DEBUG_RERENDERS = true
    const DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER = true

    const OnBoardingContext = createContext(defaultValue)

    if (process.env.NODE_ENV !== 'production') {
        OnBoardingContext.displayName = `MyContext<${name}>`
    }

    const withOnBoardingContext = () => PageComponent => {
        const WithOnBoardingContext = ({ ...pageProps }) => {
            if (DEBUG_RERENDERS) console.log(`WithMyContext<${name}>()`, pageProps)
            return (
                <OnBoardingContextProvider initialValue={defaultValue}>
                    <PageComponent {...pageProps} />
                </OnBoardingContextProvider>
            )
        }

        if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) WithOnBoardingContext.whyDidYouRender = true

        // Set the correct displayName in development
        if (process.env.NODE_ENV !== 'production') {
            const displayName = PageComponent.displayName || PageComponent.name || 'Component'
            WithOnBoardingContext.displayName = `withMyContext<${name}>(${displayName})`
        }

        return WithOnBoardingContext
    }

    const OnBoardingContextProvider = ({ children, initialValue }) => {
        const { user } = useAuth()

        const onBoarding = OnBoarding
            .useObject({ where: { user: { id: get(user, 'id') } } })

        const onBoardingSteps = OnBoardingStep
            .useObjects({ where: { onBoarding: { id: get(onBoarding, 'id') } } })

        const value = {
            ...initialValue,
            onBoarding,
            onBoardingSteps,
        }

        if (DEBUG_RERENDERS) console.log(`ContextProvider<${name}>()`, value)

        return (
            <OnBoardingContext.Provider value={value}>
                {children}
            </OnBoardingContext.Provider>
        )
    }

    if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) OnBoardingContextProvider.whyDidYouRender = true

    if (process.env.NODE_ENV !== 'production') {
        OnBoardingContextProvider.displayName = `MyContextProvider<${name}>`
    }

    const useOnBoardingContext = () => useContext(OnBoardingContext)

    return {
        useOnBoardingContext,
        withOnBoardingContext,
    }
}

export const {
    useOnBoardingContext,
    withOnBoardingContext,
} = craeteOnboardingContext(
    'onBoardingContext',
    {
        stepCompleted: false,
        isLoading: false,
    }
)
