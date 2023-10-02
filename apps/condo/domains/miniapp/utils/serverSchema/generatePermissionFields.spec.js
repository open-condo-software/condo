const {
    getSchemaDocForReadOnlyPermissionField,
} = require('./generatePermissionFields')


describe('Helper functions for generatePermissionFields function', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
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
})
