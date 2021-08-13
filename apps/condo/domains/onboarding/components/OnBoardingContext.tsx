import { BankOutlined, CheckOutlined, CreditCardFilled, ProfileFilled, WechatFilled } from '@ant-design/icons'
import get from 'lodash/get'
import Router, { useRouter } from 'next/router'
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@core/next/auth'
import { useApolloClient } from '@core/next/apollo'
import { HouseIcon } from '@condo/domains/common/components/icons/HouseIcon'
import { UserIcon } from '@condo/domains/common/components/icons/UserIcon'
import { useCreateOrganizationModalForm } from '@condo/domains/organization/hooks/useCreateOrganizationModalForm'
import { OnBoarding, OnBoardingStep } from '@condo/domains/onboarding/utils/clientSchema'
import {
    OnBoarding as IOnBoarding,
    OnBoardingStep as OnBoardingStepInterface,
    OnBoardingStep as IOnBoardingStep,
} from '../../../schema'
import { OrganizationEmployee as OrganizationEmployeeGql } from '@condo/domains/organization/gql'
import { Property as PropertyGql } from '@condo/domains/property/gql'
import { useFocusContext } from '../../common/components/Focus/FocusContextProvider'
import { useOnBoardingCompleteModal } from '../hooks/useOnBoardingCompleeteModal'
import { OnBoardingStepType } from './OnBoardingStepItem'

interface IDecoratedOnBoardingStepType extends Omit<IOnBoardingStep, 'action'> {
    stepAction: () => void,
    iconView: React.FC,
    type: OnBoardingStepType,
}

interface OnBoardingContext {
    progress?: number
    isLoading?: boolean
    onBoarding?: IOnBoarding
    onBoardingSteps?: Array<IDecoratedOnBoardingStepType>
}

const getStepKey = (step: OnBoardingStepInterface) => `${step.action}.${step.entity}`

const getParentStep = (stepTransitions: Record<string, Array<string>>, stepKey: string, steps: Array<OnBoardingStepInterface>) => {
    let parentKey: string | undefined

    Object.keys(stepTransitions).map((key) => {
        if (!parentKey && stepTransitions[key].includes(stepKey)) {
            parentKey = key
        }
    })

    if (!parentKey) {
        return null
    }

    const [targetAction, targetEntity] = parentKey.split('.')

    return steps.find((step) => (
        step.action === targetAction && step.entity === targetEntity
    ))
}

const getStepType = (
    step: OnBoardingStepInterface,
    stepsTransitions: Record<string, Array<string>>,
    steps: Array<OnBoardingStepInterface>,
) => {
    const stepKey = getStepKey(step)
    const stepTransitions = get(stepsTransitions, stepKey)
    const parentStep = getParentStep(stepsTransitions, stepKey, steps)

    const parentRequired = get(parentStep, 'required')
    const parentCompleted = get(parentStep, 'completed')

    if (Array.isArray(stepTransitions)) {
        if (parentRequired && !parentCompleted) {
            return OnBoardingStepType.DISABLED
        }

        if (step.completed) {
            return OnBoardingStepType.COMPLETED
        }

        return OnBoardingStepType.DEFAULT
    } else {
        return OnBoardingStepType.DISABLED
    }
}

const onBoardingIconsMap = {
    organization: BankOutlined,
    house: HouseIcon,
    user: UserIcon,
    chat: WechatFilled,
    billing: ProfileFilled,
    creditCard: CreditCardFilled,
}

const onBoardingQueriesMap = {
    'create.Organization': OrganizationEmployeeGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
    'create.Property': PropertyGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
    'create.OrganizationEmployee': OrganizationEmployeeGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
}

const onBoardingStepResolvers = {
    'create.Organization': (data) => data.objs.length > 0,
    'create.Property': (data) => data.objs.length > 0,
    'create.OrganizationEmployee': (data) => data.objs.length > 1,
}

const OnBoardingContext = createContext<OnBoardingContext>({})

export const useOnBoardingContext = () => useContext(OnBoardingContext)

export const OnBoardingProvider: React.FC = (props) => {
    const { user } = useAuth()
    const router = useRouter()
    const client = useApolloClient()
    const { setIsVisible: showCreateOrganizationModal, ModalForm } = useCreateOrganizationModalForm({})
    const { setIsVisible: showOnBoardingCompleteModal, OnBoardingCompleteModal, isVisible: isOnBoardingCompleteVisible } = useOnBoardingCompleteModal()
    const { showFocusTooltip } = useFocusContext()

    const { obj: onBoarding, refetch: refetchOnBoarding } = OnBoarding
        .useObject({ where: { user: { id: get(user, 'id') } } })

    const { loading: stepsLoading, objs: onBoardingSteps = [], refetch } = OnBoardingStep
        .useObjects(
            { where: { onBoarding: { id: get(onBoarding, 'id') } } },
            { fetchPolicy: 'network-only' }
        )
    const updateStep = OnBoardingStep.useUpdate({})
    const updateOnBoarding = OnBoarding.useUpdate({}, () => refetchOnBoarding())

    const onBoardingActionMap = {
        'create.Organization': () => showCreateOrganizationModal(true),
        'create.Property': () => Router.push('property/create'),
        'create.OrganizationEmployee': () => Router.push('employee/create'),
    }

    const decoratedSteps = useMemo(() => {
        return onBoardingSteps.map((step) => {
            const stepKey = getStepKey(step)

            return {
                ...step,
                stepAction: step.completed ? null : onBoardingActionMap[stepKey],
                iconView: step.completed ? CheckOutlined : onBoardingIconsMap[step.icon],
                type: getStepType(step, get(onBoarding, 'stepsTransitions'), onBoardingSteps),
            }
        })
    }, [onBoardingSteps])
    // TODO(Dimitreee): think about better sollution for progress state sync at hooks
    const progressRef = useRef(0)

    const progress = useMemo(() => {
        const totalSteps = decoratedSteps.filter((obj) => obj.type !== OnBoardingStepType.DISABLED).length
        const completedSteps = decoratedSteps.filter((obj) => obj.type === OnBoardingStepType.COMPLETED).length

        progressRef.current = (completedSteps / totalSteps) * 100

        return progressRef.current
    }, [decoratedSteps])

    useEffect(() => {
        decoratedSteps.forEach(async (step) => {
            const { completed } = step
            const stepKey = getStepKey(step)

            const query = onBoardingQueriesMap[stepKey]

            if (!completed && query) {
                client.watchQuery({ query }).result().then((res) => {
                    const resolver = onBoardingStepResolvers[stepKey]

                    if (resolver(res.data)) {
                        updateStep({ completed: true }, step).then(() => {
                            refetch().then(() => {
                                if (router.pathname !== '/onboarding' && progressRef.current < 100) {
                                    showFocusTooltip()
                                }
                            })
                        })
                    }
                })
            }
        })
    }, [decoratedSteps, progress, onBoarding])

    useEffect(() => {
        if (progress === 100 && !isOnBoardingCompleteVisible && !get(onBoarding, 'completed', false)) {
            updateOnBoarding({ completed: true }, onBoarding).then(() => {
                showOnBoardingCompleteModal(true)
            })
        }
    }, [progress, router, onBoarding])

    return (
        <OnBoardingContext.Provider value={{
            progress,
            onBoarding,
            isLoading: stepsLoading,
            onBoardingSteps: decoratedSteps,
        }}>
            {props.children}
            <ModalForm/>
            <OnBoardingCompleteModal/>
        </OnBoardingContext.Provider>
    )
}
