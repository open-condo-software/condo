const get = require('lodash/get')

const { ONBOARDING_STEP_TYPE } = require('@condo/domains/onboarding/constants')

const getStepKey = (step) => `${step.action}.${step.entity}`

const getParentStep = (stepTransitions, stepKey, steps) => {
    let parentKey

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
    step,
    stepsTransitions,
    steps,
) => {
    const stepKey = getStepKey(step)
    const stepTransitions = get(stepsTransitions, stepKey)
    const parentStep = getParentStep(stepsTransitions, stepKey, steps)

    const parentRequired = get(parentStep, 'required')
    const parentCompleted = get(parentStep, 'completed')

    if (Array.isArray(stepTransitions)) {
        if (parentRequired && !parentCompleted) {
            return ONBOARDING_STEP_TYPE.DISABLED
        }

        if (step.completed) {
            return ONBOARDING_STEP_TYPE.COMPLETED
        }

        return ONBOARDING_STEP_TYPE.DEFAULT
    }
}

const getOnBoardingProgress = (onBoardingSteps, onBoarding) => {
    const stepTypes = onBoardingSteps.map((step) => getStepType(step, get(onBoarding, 'stepsTransitions', {}), onBoardingSteps))
    const totalAvailableSteps = stepTypes.filter((type) => type !== undefined && type !== ONBOARDING_STEP_TYPE.DISABLED).length
    const completedSteps = onBoardingSteps.filter((obj) => obj.completed === true).length

    return (completedSteps / totalAvailableSteps) * 100
}

module.exports = {
    getStepKey,
    getParentStep,
    getOnBoardingProgress,
}
