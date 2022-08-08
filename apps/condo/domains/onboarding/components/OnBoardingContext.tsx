import { BankFilled, CheckOutlined, CreditCardFilled, ProfileFilled, WechatFilled } from '@ant-design/icons'
import get from 'lodash/get'
import Router, { useRouter } from 'next/router'
import React, { createContext, useContext, useEffect } from 'react'
import { useAuth } from '@core/next/auth'
import { useApolloClient } from '@core/next/apollo'
import { HouseIcon } from '@condo/domains/common/components/icons/HouseIcon'
import { UserIcon } from '@condo/domains/common/components/icons/UserIcon'
import { useCreateOrganizationModalForm } from '@condo/domains/organization/hooks/useCreateOrganizationModalForm'
import { OnBoarding as OnBoardingHooks, OnBoardingStep as OnBoardingStepHooks } from '@condo/domains/onboarding/utils/clientSchema'
import {
    OnBoarding as IOnBoarding,
    OnBoardingStep as IOnBoardingStep,
} from '@app/condo/schema'
import { OrganizationEmployee as OrganizationEmployeeGql } from '@condo/domains/organization/gql'
import { Property as PropertyGql } from '@condo/domains/property/gql'
import { Division as DivisionGql } from '@condo/domains/division/gql'
import { useFocusContext } from '@condo/domains/common/components/Focus/FocusContextProvider'
import { useOnBoardingCompleteModal } from '@condo/domains/onboarding/hooks/useOnBoardingCompleeteModal'
import {
    getOnBoardingProgress,
    getStepKey,
    getStepType,
} from '@condo/domains/onboarding/utils/stepUtils'
import { OnBoardingStepType } from './OnBoardingStepItem'
import { ONBOARDING_COMPLETED_PROGRESS } from '@condo/domains/onboarding/constants'

interface IDecoratedOnBoardingStepType extends Omit<IOnBoardingStep, 'action'> {
    stepAction: () => void,
    iconView: React.FC,
    type: OnBoardingStepType | null,
}

export interface IOnBoardingContext {
    progress?: number
    isLoading?: boolean
    onBoarding?: IOnBoarding
    onBoardingSteps?: Array<IDecoratedOnBoardingStepType>
    refetchOnBoarding?: () => void
}

const onBoardingIcons = {
    organization: BankFilled,
    house: HouseIcon,
    user: UserIcon,
    division: WechatFilled,
    chat: WechatFilled,
    billing: ProfileFilled,
    creditCard: CreditCardFilled,
}

const OnBoardingContext = createContext<IOnBoardingContext>({})

export const useOnBoardingContext = () => useContext(OnBoardingContext)

export const OnBoardingProvider: React.FC = (props) => {
    const { user } = useAuth()
    const router = useRouter()
    const client = useApolloClient()
    const { showFocusTooltip } = useFocusContext()
    const { setIsVisible: showCreateOrganizationModal, ModalForm } = useCreateOrganizationModalForm({})
    const { setIsVisible: showOnBoardingCompleteModal, OnBoardingCompleteModal, isVisible: isOnBoardingCompleteVisible } = useOnBoardingCompleteModal()

    const { obj: onBoarding, refetch: refetchOnBoarding } = OnBoardingHooks
        .useObject(
            { where: { user: { id: get(user, 'id') } } },
            { fetchPolicy: 'network-only' },
        )

    const { objs: onBoardingSteps = [], refetch: refetchSteps, loading: stepsLoading } = OnBoardingStepHooks
        .useObjects(
            { where: { onBoarding: { id: get(onBoarding, 'id') } } },
            { fetchPolicy: 'network-only' }
        )

    const updateOnBoarding = OnBoardingHooks.useUpdate({}, () => refetchOnBoarding())
    const updateStep = OnBoardingStepHooks.useUpdate({})

    const onBoardingStepsConfig = {
        'create.Organization': {
            query: OrganizationEmployeeGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
            resolver: (data) => get(data, 'objs', []).length > 0,
            action: () => showCreateOrganizationModal(true),
        },
        'create.Property': {
            query: PropertyGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
            resolver: (data) => get(data, 'objs', []).length > 0,
            action: () => Router.push('property/create'),
        },
        'create.OrganizationEmployee': {
            query: OrganizationEmployeeGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
            resolver: (data) => get(data, 'objs', []).length > 1,
            action: () => Router.push('employee/create'),
        },
        'create.Division': {
            query: DivisionGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
            resolver: (data) => get(data, 'objs', []).length > 0,
            action: () => Router.push('division/create'),
        },
    }

    const stepsCompleted = onBoardingSteps.filter(step => step.completed)

    const decoratedSteps = onBoardingSteps.map((step) => {
        const stepKey = getStepKey(step)

        return {
            ...step,
            stepAction: step.completed ? null : get(onBoardingStepsConfig, [stepKey, 'action'], () => { void 0 }),
            iconView: step.completed ? CheckOutlined : onBoardingIcons[step.icon],
            type: getStepType(step, get(onBoarding, 'stepsTransitions', {}), onBoardingSteps),
        }
    })

    useEffect(() => {
        onBoardingSteps.forEach(async (step) => {
            const stepKey = getStepKey(step)
            const query = get(onBoardingStepsConfig, [stepKey, 'query'], null)

            if (!step.completed && query) {
                client.watchQuery({ query }).refetch().then((res) => {
                    const resolver = get(onBoardingStepsConfig, [stepKey, 'resolver'], () => { void 0 })

                    if (resolver(res.data) && !get(onBoarding, 'completed')) {
                        updateStep({ completed: true }, step).then(() => {
                            refetchSteps().then(({ data }) => {
                                const { objs: steps } = data
                                const onBoardingProgress = getOnBoardingProgress(steps, onBoarding)

                                if (router.pathname !== '/onboarding' && onBoardingProgress < ONBOARDING_COMPLETED_PROGRESS) {
                                    showFocusTooltip()
                                }

                                if (onBoardingProgress === ONBOARDING_COMPLETED_PROGRESS) {
                                    updateOnBoarding({ completed: true }, onBoarding).then(() => {
                                        showOnBoardingCompleteModal(true)
                                    })
                                }
                            })
                        })
                    }
                })
            }
        })
    }, [onBoarding, onBoardingSteps, isOnBoardingCompleteVisible, stepsCompleted])

    return (
        <OnBoardingContext.Provider value={{
            progress: getOnBoardingProgress(onBoardingSteps, onBoarding),
            onBoarding,
            isLoading: stepsLoading,
            onBoardingSteps: decoratedSteps,
            refetchOnBoarding,
        }}>
            {props.children}
            <ModalForm/>
            <OnBoardingCompleteModal/>
        </OnBoardingContext.Provider>
    )
}
