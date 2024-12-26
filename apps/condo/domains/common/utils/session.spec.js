const { makeSessionData } = require('@condo/domains/common/utils/session')

const TESTS_SUITES = [
    {
        name: 'organizations',
        suites: [
            {
                name: 'not provided',
                expected: { allowedOrganizations: true },
            },
            {
                name: 'provided null',
                args: { allowedOrganizations: null },
                expected: { allowedOrganizations: false },
            },
            {
                name: 'provided nulls',
                args: { allowedOrganizations: [null, null] },
                expected: { allowedOrganizations: [] },
            },
            {
                name: 'provided duplicated',
                args: { allowedOrganizations: ['some-id', 'some-id', 'some-id'] },
                expected: { allowedOrganizations: ['some-id'] },
            },
        ],
    },
    {
        name: 'B2B app permissions',
        suites: [
            {
                name: 'not provided',
                expected: { enabledB2BAppPermissions: true },
            },
            {
                name: 'provided null',
                args: { enabledB2BAppPermissions: null },
                expected: { enabledB2BAppPermissions: false },
            },
            {
                name: 'provided nulls',
                args: { enabledB2BAppPermissions: [null, null] },
                expected: { enabledB2BAppPermissions: [] },
            },
            {
                name: 'provided duplicates',
                args: { enabledB2BAppPermissions: ['canManageSomething', 'canManageSomething', 'canManageSomething'] },
                expected: { enabledB2BAppPermissions: ['canManageSomething'] },
            },
        ],
    },
]

describe('session', () => {

    describe.each(TESTS_SUITES)('$name', ({ suites }) => {
        
        test.each(suites)('$name', ({ args, expected }) => {
            const sessionData = makeSessionData(args)
            expect(sessionData).toEqual(expect.objectContaining(expected))
        })

    })

})