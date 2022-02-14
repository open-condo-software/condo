const { getOnBoardingProgress } = require('@condo/domains/onboarding/utils/serverSideStepUtils')
const { ONBOARDING_COMPLETED_PROGRESS } = require('@condo/domains/onboarding/constants')

const { find, getByCondition } = require('@core/keystone/schema')

async function getOnBoardingStatus (user) {
    const onBoarding = await getByCondition('OnBoarding', { user: { id: user.id } })
    if (!onBoarding) return { finished: false }

    const onBoardingSteps = await find('OnBoardingStep', { onBoarding: { id: onBoarding.id } })
    const progress = getOnBoardingProgress(onBoardingSteps, onBoarding)
    return { progress, finished: !(progress < ONBOARDING_COMPLETED_PROGRESS) }
}

module.exports = {
    getOnBoardingStatus,
}