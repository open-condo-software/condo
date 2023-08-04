const { faker } = require('@faker-js/faker')

const {
    generateGqlDataPart,
    generateGqlQueryAsString,
    getFilter,
    getSchemaDocForReadOnlyPermissionField,
} = require('./B2BAppAccess')



describe('Helpers function for B2BAppAccess', () => {
    describe('generateGqlDataPart', () => {
        const validCases = [
            {
                input: ['a'],
                output: '{ a }',
            },
            {
                input: ['a', 'b', 'c'],
                output: '{ a { b { c } } }',
            },
            {
                input: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
                output: '{ a { b { c { d { e { f { g { h { i { j } } } } } } } } } }',
            },
        ]
        const invalidCases = [
            {
                input: [],
                error: '"pathToOrganizationId" should not be empty array',
            },
            {
                input: null,
                error: '"pathToOrganizationId" should not be empty array',
            },
            {
                input: 'a b c d',
                error: '"pathToOrganizationId" should not be empty array',
            },
        ]

        test.each(validCases)('generateGqlDataPart($input) - returned "$output"', async ({ input, output }) => {
            expect(generateGqlDataPart(input)).toEqual(output)
        })

        test.each(invalidCases)('generateGqlDataPart($input) - throw error "$error"', async ({ input, error }) => {
            expect(() => generateGqlDataPart(input)).toThrow(error)
        })
    })

    describe('generateGqlQueryAsString', () => {
        const validCases = [
            {
                input: {
                    listKey: 'Organization',
                    pathToOrganizationId: ['id'],
                },
                output: `
        query getAllOrganizations ($where: OrganizationWhereInput, $first: Int = 1) {
            objs: allOrganizations(where: $where, first: $first) { id }
        }
    `,
            },
            {
                input: {
                    listKey: 'Property',
                    pathToOrganizationId: ['organization', 'id'],
                },
                output: `
        query getAllProperties ($where: PropertyWhereInput, $first: Int = 1) {
            objs: allProperties(where: $where, first: $first) { organization { id } }
        }
    `,
            },
            {
                input: {
                    listKey: 'TicketChange',
                    pathToOrganizationId: ['ticket', 'organization', 'id'],
                },
                output: `
        query getAllTicketChanges ($where: TicketChangeWhereInput, $first: Int = 1) {
            objs: allTicketChanges(where: $where, first: $first) { ticket { organization { id } } }
        }
    `,
            },
        ]
        const invalidCases = [
            {
                input: {
                    listKey: 'Organization',
                    pathToOrganizationId: 'id',
                },
                error: '"pathToOrganizationId" should not be empty array',
            },
            {
                input: {
                    listKey: 'Organization',
                    pathToOrganizationId: [],
                },
                error: '"pathToOrganizationId" should not be empty array',
            },
            {
                input: {
                    listKey: 'Organization',
                    pathToOrganizationId: null,
                },
                error: '"pathToOrganizationId" should not be empty array',
            },
            {
                input: {
                    listKey: ['Property'],
                    pathToOrganizationId: ['organization', 'id'],
                },
                error: '"listKey" must not be empty string!',
            },
            {
                input: {
                    listKey: '      ',
                    pathToOrganizationId: ['organization', 'id'],
                },
                error: '"listKey" must not be empty string!',
            },
            {
                input: {
                    listKey: null,
                    pathToOrganizationId: null,
                },
                error: '"listKey" must not be empty string!',
            },
        ]

        test.each(validCases)('generateGqlQueryAsString($input.listKey, $input.pathToOrganizationId) - returned valid value (%#)', async ({ input: { listKey, pathToOrganizationId }, output }) => {
            expect(generateGqlQueryAsString(listKey, pathToOrganizationId)).toEqual(output)
        })

        test.each(invalidCases)('generateGqlQueryAsString($input.listKey, $input.pathToOrganizationId) - throw error "$error"', async ({ input: { listKey, pathToOrganizationId }, error }) => {
            expect(() => generateGqlQueryAsString(listKey, pathToOrganizationId)).toThrow(error)
        })
    })

    describe('getFilter', () => {
        const organizationId = faker.datatype.uuid()
        const validCases = [
            {
                input: {
                    pathToOrganizationId: ['a'],
                    organizationId,
                },
                output: {
                    'a': organizationId,
                    deletedAt: null,
                },
            },
            {
                input: {
                    pathToOrganizationId: ['a', 'b', 'c'],
                    organizationId,
                },
                output: {
                    'a': {
                        'b': {
                            'c': organizationId,
                            deletedAt: null,
                        },
                        deletedAt: null,
                    },
                    deletedAt: null,
                },
            },
            {
                input: {
                    pathToOrganizationId: ['a', 'b', 'c', 'd', 'e'],
                    organizationId,
                },
                output: {
                    'a': {
                        'b': {
                            'c': {
                                'd': {
                                    'e': organizationId,
                                    deletedAt: null,
                                },
                                deletedAt: null,
                            },
                            deletedAt: null,
                        },
                        deletedAt: null,
                    },
                    deletedAt: null,
                },
            },
        ]
        const invalidCases = [
            {
                input: {
                    pathToOrganizationId: [],
                    organizationId,
                },
                error: '"pathToOrganizationId" must be not empty array!',
            },
            {
                input: {
                    pathToOrganizationId: null,
                    organizationId,
                },
                error: '"pathToOrganizationId" must be not empty array!',
            },
            {
                input: {
                    pathToOrganizationId: ['a', 'b', 'c', 'd', 'e'],
                    organizationId: null,
                },
                error: '"organizationId" must be string!',
            },
            {
                input: {
                    pathToOrganizationId: ['a', 'b', 'c', 'd', 'e'],
                    organizationId: '      ',
                },
                error: '"organizationId" must be string!',
            },
        ]

        test.each(validCases)('getFilter($input.pathToOrganizationId, $input.organizationId) - returned valid value (%#)', async ({ input: { pathToOrganizationId, organizationId }, output }) => {
            expect(getFilter(pathToOrganizationId, organizationId)).toEqual(output)
        })

        test.each(invalidCases)('getFilter($input.listKey, $input.pathToOrganizationId) - throw error "$error"', async ({ input: { pathToOrganizationId, organizationId }, error }) => {
            expect(() => getFilter(pathToOrganizationId, organizationId)).toThrow(error)
        })
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
