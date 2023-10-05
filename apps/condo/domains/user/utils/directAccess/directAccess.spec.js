const { generateFieldNames } = require('./common.utils')
const { generateRightSetFields } = require('./server.utils')

describe('Direct access utils specs', () => {
    const TEST_CONFIGS = [
        [
            'string-passed list',
            { lists: ['B2BApp'], fields: {}, services: [] },
            ['canReadB2BApps', 'canManageB2BApps'],
        ],
        [
            'config-passed list',
            { lists: [{ schemaName: 'B2CAppBuild' }], fields: {}, services: [] },
            ['canReadB2CAppBuilds', 'canManageB2CAppBuilds'],
        ],
        [
            'config-passed readonly list',
            { lists: [{ schemaName: 'Organization', readonly: true }], fields: {}, services: [] },
            ['canReadOrganizations'],
        ],
        [
            'mutation / query',
            { lists: [], fields: {}, services: ['allMiniApps', 'registerNewServiceUser'] },
            ['canExecuteAllMiniApps', 'canExecuteRegisterNewServiceUser'],
        ],
        [
            'field',
            { lists: [], fields: { Organization: ['isApproved'] }, services: [] },
            ['canManageOrganizationIsApprovedField'],
        ],
        [
            'complex example',
            {
                lists: ['B2BApp', { schemaName: 'Organization', readonly: true }],
                fields: { Organization: ['isApproved'] },
                services: ['registerNewServiceUser'],
            },
            [
                'canReadB2BApps', 'canManageB2BApps', 'canReadOrganizations', 'canExecuteRegisterNewServiceUser',
                'canManageOrganizationIsApprovedField',
            ],
        ],
    ]
    describe('generateFieldNames', () => {
        describe('Must parse valid configs', () => {
            it.each(TEST_CONFIGS)('%p', (_, config, expectedFieldNames) => {
                const fieldNames = generateFieldNames(config)
                expect(fieldNames).toEqual(expect.arrayContaining(expectedFieldNames))
                expect(fieldNames).toHaveLength(expectedFieldNames.length)
            })
        })
    })
    describe('generateRightSetFields', () => {
        describe('Must generate valid fields', () => {
            it.each(TEST_CONFIGS)('%p', (_, config, expectedFieldNames) => {
                const expectedFields = Object.assign({}, ...expectedFieldNames.map(fieldName => ({
                    [fieldName]: expect.objectContaining({
                        type: 'Checkbox',
                        defaultValue: false,
                        isRequired: true,
                    }),
                })))

                const fields = generateRightSetFields(config)
                expect(fields).toEqual(expectedFields)
            })
        })
    })
})