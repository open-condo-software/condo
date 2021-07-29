const { updateOnBoardingStepByAuthUser } = require('@condo/domains/onboarding/utils/serverSchema')

const organizationOnBoardingTrigger = {
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
                    value: 'Organization',
                },
            ],
        },
        event: {
            type: 'organizationOnBoardingTrigger',
        },
    },
    action: (_, context) => {
        if (context) {
            updateOnBoardingStepByAuthUser(context, 'create', 'Organization')
        }
    },
}

module.exports = {
    organizationOnBoardingTrigger,
}
