import get from 'lodash/get'
import Router from 'next/router'
import React, { createContext, useContext, useEffect, useState } from 'react'
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

const OnBoardingContext = createContext<OnBoardingContext>({
    stepCompleted: false,
    isLoading: false,
})

export const useOnBoardingContext = () => useContext(OnBoardingContext)

export const OnBoardingProvider: React.FC = (props) => {
    const { user } = useAuth()
    const client = useApolloClient()

    const { loading: onBoardingLoading, obj: onBoarding } = OnBoarding
        .useObject({ where: { user: { id: get(user, 'id') } } })

    const { loading: stepsLoading, objs: onBoardingSteps, refetch } = OnBoardingStep
        .useObjects({ where: { onBoarding: { id: get(onBoarding, 'id') } } })

    const updateAction = OnBoardingStep.useUpdate({}, () => refetch())

    const onBoardingQueriesMap = {
        'create.Organization': OrganizationGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
        'create.Property': PropertyGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
        'create.OrganizationEmployee': OrganizationEmployeeGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
    }

    onBoardingSteps.forEach(async (step) => {
        const { action, entity, completed } = step
        const key = `${action}.${entity}`

        const query = onBoardingQueriesMap[key]

        if (!completed && query) {
            client.watchQuery({ query }).result().then((res) => {
                console.log(res)
                if (res.data.objs.length > 0) {
                    updateAction({ completed: true }, step).then(() => {
                        refetch()
                    })
                }
            })
        }
    })

    /*
    *
    * 1) Используя динамический импорт грузим модуль с кверями на которую есть экшн.
    * 2) После подгрузки, забираем нужные квери.
    * 3) После того как все забрали, регаем эффект.
    * 4) После инициализации стора регаем вотчер на квери в apollo
    *
    * */

    /*
    *
    * 1) Есть экшены CRUD + entity
    *   GET_ALL_OBJS_QUERY,
    *   CREATE_OBJ_MUTATION,
    *   UPDATE_OBJ_MUTATION,
    *   DELETE_OBJ_MUTATION,
    *
    * */

    const [stepCompleted, setStepCompleted] = useState()

    return (
        <OnBoardingContext.Provider value={{
            stepCompleted,
            isLoading: onBoardingLoading || stepsLoading,
            onBoarding,
            onBoardingSteps,
        }}>
            {props.children}
        </OnBoardingContext.Provider>
    )
}
