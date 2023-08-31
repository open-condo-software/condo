const { generateFieldNames, generateRightSetFields } = require('./directAccess')

describe('Direct access utils specs', () => {
    const TEST_CONFIGS = [
        [
            'string-passed list',
            { lists: ['B2BApp'], services: [] },
            ['canReadB2BApps', 'canManageB2BApps'],
        ],
        [
            'config-passed list',
            { lists: [{ schemaName: 'B2CAppBuild' }], services: [] },
            ['canReadB2CAppBuilds', 'canManageB2CAppBuilds'],
        ],
        [
            'config-passed readonly list',
            { lists: [{ schemaName: 'Organization', readonly: true }], services: [] },
            ['canReadOrganizations'],
        ],
        [
            'mutation / query',
            { lists: [], services: ['allMiniApps', 'registerNewServiceUser'] },
            ['canExecuteAllMiniApps', 'canExecuteRegisterNewServiceUser'],
        ],
        [
            'complex example',
            { lists: ['B2BApp', { schemaName: 'Organization', readonly: true }], services: ['registerNewServiceUser'] },
            ['canReadB2BApps', 'canManageB2BApps', 'canReadOrganizations', 'canExecuteRegisterNewServiceUser'],
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