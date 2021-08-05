import get from 'lodash/get'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@core/next/auth'
import { useApolloClient } from '@core/next/apollo'
import { OnBoarding, OnBoardingStep } from '../utils/clientSchema'
import { OnBoarding as IOnBoarding, OnBoardingStep as IOnBoardingStep } from '../../../schema'

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

    const { loading: onBoardingLoading, obj: onBoarding, error: onBoardingError } = OnBoarding
        .useObject({ where: { user: { id: get(user, 'id') } } })

    const { loading: stepsLoading, objs: onBoardingSteps, error: stepsError, refetch } = OnBoardingStep
        .useObjects({ where: { onBoarding: { id: get(onBoarding, 'id') } } }, {
            fetchPolicy: 'network-only',
        })

    const updateAction = OnBoardingStep.useUpdate({}, () => refetch())

    useEffect(() => {
        onBoardingSteps.forEach(async (step) => {
            const { action, entity, id, completed } = step

            if (!completed) {
                import(`../../${entity.toLowerCase()}/gql`).then((module) => {
                    console.log(module)
                })
            }
        })
    }, [onBoardingSteps])

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
