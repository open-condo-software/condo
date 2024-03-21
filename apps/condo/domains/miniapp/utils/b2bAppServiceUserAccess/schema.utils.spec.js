const {
    generatePermissionFields,
    getSchemaDocForReadOnlyPermissionField,
    PERMISSION_FIELD,
    READ_ONLY_PERMISSION_FIELD,
} = require('./schema.utils')


describe('Schema functions', () => {
    describe('getSchemaDocForReadOnlyPermissionField', () => {
        const validCases = [
            {
                input: 'canReadTickets',
                output: 'Currently, this field is read-only. You cannot get read access for the specified schema.',
            },
            {
                input: 'canManageProperties',
                output: 'Currently, this field is read-only. You cannot get manage access for the specified schema.',
            },
        ]
        const invalidCases = [
            {
                input: '    ',
                error: '"permissionFieldName" must be not empty string!',
            },
            {
                input: null,
                error: '"permissionFieldName" must be not empty string!',
            },
            {
                input: 'CanManageTickets',
                error: 'Permission field name no starts with "canManage" or "canRead"! You should check the implementation!',
            },
            {
                input: 'readTickets',
                error: 'Permission field name no starts with "canManage" or "canRead"! You should check the implementation!',
            },
        ]

        test.each(validCases)('getSchemaDocForReadOnlyPermissionField($input) - returned valid value ($output)', async ({ input, output }) => {
            expect(getSchemaDocForReadOnlyPermissionField(input)).toEqual(output)
        })

        test.each(invalidCases)('getSchemaDocForReadOnlyPermissionField$input) - throw error "$error"', async ({ input, error }) => {
            expect(() => getSchemaDocForReadOnlyPermissionField(input)).toThrow(error)
        })
    })

    describe('generatePermissionFields', () => {
        const cases = [{
            input: {
                config: {
                    lists: {
                        Organization: {
                            pathToOrganizationId: ['id'],
                            canBeManaged: false,
                        },
                        Contact: {},
                        Abracadabra: {
                            canBeRead: false,
                            canBeManaged: false,
                        },
                    },
                    services: {
                        registerSomething: {},
                    },
                },
            },
            output: {
                canReadOrganizations: PERMISSION_FIELD,
                canManageOrganizations: {
                    ...READ_ONLY_PERMISSION_FIELD,
                    schemaDoc: 'Currently, this field is read-only. You cannot get manage access for the specified schema.',
                },
                canReadContacts: PERMISSION_FIELD,
                canManageContacts: PERMISSION_FIELD,
                canReadAbracadabras: {
                    ...READ_ONLY_PERMISSION_FIELD,
                    schemaDoc: 'Currently, this field is read-only. You cannot get read access for the specified schema.',
                },
                canManageAbracadabras: {
                    ...READ_ONLY_PERMISSION_FIELD,
                    schemaDoc: 'Currently, this field is read-only. You cannot get manage access for the specified schema.',
                },
                canExecuteRegisterSomething: PERMISSION_FIELD,
            },
        }]

        test.each(cases)('should return correct result', ({ input, output }) => {
            expect(generatePermissionFields(input)).toEqual(output)
        })
    })
})
