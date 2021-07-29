const { updateOnBoardingStepByAuthUser } = require('@condo/domains/onboarding/utils/serverSchema')

const propertyOnBoardingTrigger = {
    rule: {
        conditions: {
            all: [
                {
                    fact: 'operation',
                    operator: 'equal',
                    value: 'create',
                },
                {
                    fact: 'listKey',
                    operator: 'equal',
                    value: 'Property',
                },
            ],
        },
        event: {
            type: 'propertyOnBoardingTrigger',
        },
    },
    action: async (_, context) => {
        if (context) {
            await updateOnBoardingStepByAuthUser(context, 'create', 'Property')
        }
    },
}

module.exports = {
    propertyOnBoardingTrigger,
}
