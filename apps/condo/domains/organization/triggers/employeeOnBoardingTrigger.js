const { updateOnBoardingStepByAuthUser } = require('@condo/domains/onboarding/utils/serverSchema')

const employeeOnBoardingTrigger = {
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
                    value: 'OrganizationEmployee',
                },
            ],
        },
        event: {
            type: 'employeeOnBoardingTrigger',
        },
    },
    action: async (_, context) => {
        if (context) {
            // await updateOnBoardingStepByAuthUser(context, 'create', 'OrganizationEmployee')
        }
    },
}

module.exports = {
    employeeOnBoardingTrigger,
}
