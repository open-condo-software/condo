import { OnBoarding, OnBoardingStep, OnBoardingStep as OnBoardingStepInterface } from '@app/condo/schema'
import get from 'lodash/get'

import { OnBoardingStepType } from '@condo/domains/onboarding/components/OnBoardingStepItem'

export const getStepKey = (step: OnBoardingStepInterface) => `${step.action}.${step.entity}`

export const getParentStep = (stepTransitions: Record<string, Array<string>>, stepKey: string, steps: Array<OnBoardingStepInterface>) => {
    let parentKey: string | undefined

    Object.keys(stepTransitions).forEach((key) => {
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

export const getStepType = (
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
    }
}

export const getOnBoardingProgress = (onBoardingSteps: Array<OnBoardingStep>, onBoarding: OnBoarding) => {
    const stepTypes = onBoardingSteps.map((step) => getStepType(step, get(onBoarding, 'stepsTransitions', {}), onBoardingSteps))
    const totalAvailableSteps = stepTypes.filter((type) => type !== undefined && type !== OnBoardingStepType.DISABLED).length
    const completedSteps = onBoardingSteps.filter((obj) => obj.completed === true).length

    return (completedSteps / totalAvailableSteps) * 100
}
