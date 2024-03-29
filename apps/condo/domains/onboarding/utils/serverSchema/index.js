

const { generateServerUtils, execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')

const { STEP_TYPES, INITIAL_ENABLED_STEPS, TODO_STEP_STATUS, DISABLED_STEP_STATUS, STEP_ORDER } = require('@condo/domains/onboarding/constants/steps')
const { OnBoarding: OnBoardingGQL } = require('@condo/domains/onboarding/gql')
const { OnBoardingStep: OnBoardingStepGQL } = require('@condo/domains/onboarding/gql')
const { CREATE_ON_BOARDING_MUTATION } = require('@condo/domains/onboarding/gql')
const { TourStep: TourStepGQL } = require('@condo/domains/onboarding/gql')
const { SYNC_TOUR_STEPS_MUTATION } = require('@condo/domains/onboarding/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const OnBoarding = generateServerUtils(OnBoardingGQL)
const OnBoardingStep = generateServerUtils(OnBoardingStepGQL)

async function createOnBoarding (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: CREATE_ON_BOARDING_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to createOnBoarding',
        dataPath: 'obj',
    })
}

const TourStep = generateServerUtils(TourStepGQL)

async function syncTourSteps (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: SYNC_TOUR_STEPS_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to syncTourSteps',
        dataPath: 'obj',
    })
}

/* AUTOGENERATE MARKER <CONST> */

const createTourStepsForOrganization = async (context, organization, dvSenderData) => {
    const data = STEP_TYPES.map(step => ({
        data: {
            organization: { connect: { id: organization.id } },
            type: step,
            status: INITIAL_ENABLED_STEPS.includes(step) ? TODO_STEP_STATUS : DISABLED_STEP_STATUS,
            order: STEP_ORDER[step],
            ...dvSenderData,
        },
    }))

    await TourStep.createMany(context, data)
}

module.exports = {
    OnBoarding,
    OnBoardingStep,
    createOnBoarding,
    createTourStepsForOrganization,
    TourStep,
    syncTourSteps,
/* AUTOGENERATE MARKER <EXPORTS> */
}
