import get from 'lodash/get'
import { OnBoardingStep as OnBoardingStepInterface } from '../../../schema'
import { OnBoardingStepType } from '../components/OnBoardingStepItem'

export const getStepKey = (step: OnBoardingStepInterface) => `${step.action}.${step.entity}`

export const getParentStep = (stepTransitions: Record<string, Array<string>>, stepKey: string, steps: Array<OnBoardingStepInterface>) => {
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

