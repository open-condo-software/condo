const { REMOTE_CLIENT_GROUP_UNGROUPED } = require('@condo/domains/notification/constants/constants')

const { groupIntoParallelGroupsWithSequentialBatches } = require('./helpers')


describe('groupIntoParallelGroupsWithSequentialBatches', () => {

    const testCases = [
        {
            name: 'groups remote clients by app groups correctly',
            remoteClients: [
                { appId: 'app1', token: 'token1' },
                { appId: 'app2', token: 'token2' },
                { appId: 'app3', token: 'token3' },
                { appId: 'app4', token: 'token4' },
            ],
            appsGroups: {
                'group1': ['app1', 'app2'],
                'group2': ['app3'],
            },
            expectedResult: {
                group1: [[{ appId: 'app1', token: 'token1' }], [{ appId: 'app2', token: 'token2' }]],
                group2: [[{ appId: 'app3', token: 'token3' }]],
                [REMOTE_CLIENT_GROUP_UNGROUPED]: [[{ appId: 'app4', token: 'token4' }]],
            },
        },
        {
            name: 'handles empty remote clients array',
            remoteClients: [],
            appsGroups: {
                'group1': ['app1', 'app2'],
            },
            expectedResult: {},
        },
        {
            name: 'handles empty apps groups',
            remoteClients: [
                { appId: 'app1', token: 'token1' },
            ],
            appsGroups: {},
            expectedResult: {
                [REMOTE_CLIENT_GROUP_UNGROUPED]: [[{ appId: 'app1', token: 'token1' }]],
            },
        },
        {
            name: 'handles remote clients with no matching app groups',
            remoteClients: [
                { appId: 'unknown_app1', token: 'token1' },
                { appId: 'unknown_app2', token: 'token2' },
            ],
            appsGroups: {
                'group1': ['app1', 'app2'],
            },
            expectedResult: {
                [REMOTE_CLIENT_GROUP_UNGROUPED]: [[{ appId: 'unknown_app1', token: 'token1' }, { appId: 'unknown_app2', token: 'token2' }]],
            },
        },
        {
            name: 'handles multiple remote clients with same app ID',
            remoteClients: [
                { appId: 'app1', token: 'token1' },
                { appId: 'app1', token: 'token2' },
                { appId: 'app2', token: 'token3' },
            ],
            appsGroups: {
                'group1': ['app1', 'app2'],
            },
            expectedResult: {
                group1: [[
                    { appId: 'app1', token: 'token1' },
                    { appId: 'app1', token: 'token2' },
                ], [
                    { appId: 'app2', token: 'token3' },
                ]],
            },
        },
        {
            name: 'handles appsGroups with empty app ID arrays',
            remoteClients: [
                { appId: 'app1', token: 'token1' },
            ],
            appsGroups: {
                'empty_group': [],
                'group1': ['app1'],
            },
            expectedResult: {
                group1: [[{ appId: 'app1', token: 'token1' }]],
            },
        },
        {
            name: 'maintains order of app IDs in groups',
            remoteClients: [
                { appId: 'app3', token: 'token3' },
                { appId: 'app1', token: 'token1' },
                { appId: 'app2', token: 'token2' },
            ],
            appsGroups: {
                'ordered_group': ['app1', 'app2', 'app3'],
            },
            expectedResult: {
                ordered_group: [
                    [{ appId: 'app1', token: 'token1' }],
                    [{ appId: 'app2', token: 'token2' }],
                    [{ appId: 'app3', token: 'token3' }],
                ],
            },
        },
        {
            name: 'keeps each remote client only in one group in case of crossing groups',
            remoteClients: [
                { appId: 'app3', token: 'token3' },
                { appId: 'app1', token: 'token1' },
                { appId: 'app2', token: 'token2' },
            ],
            appsGroups: {
                'group_1': ['app1', 'app2', 'app3'],
                'group_2': ['app1'],
                'group_3': ['app2'],
            },
            expectedResult: {
                group_1: [[{ appId: 'app3', token: 'token3' }]],
                group_2: [[{ appId: 'app1', token: 'token1' }]],
                group_3: [[{ appId: 'app2', token: 'token2' }]],
            },
        },
    ]

    test.each(testCases)('$name', ({ remoteClients, appsGroups, expectedResult }) => {
        const result = groupIntoParallelGroupsWithSequentialBatches(remoteClients, appsGroups)

        expect(result).toEqual(expectedResult)
    })
})
