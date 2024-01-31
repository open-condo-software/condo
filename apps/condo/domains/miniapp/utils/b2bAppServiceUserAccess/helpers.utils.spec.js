const { faker } = require('@faker-js/faker')

const {
    generateGqlDataPartToOrganizationId,
    generateGqlQueryToOrganizationIdAsString,
    getFilterByOrganizationIds,
} = require('./helpers.utils')


describe('Helper functions', () => {
    describe('generateGqlDataPartToOrganizationId', () => {
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
            expect(generateGqlDataPartToOrganizationId(input)).toEqual(output)
        })

        test.each(invalidCases)('generateGqlDataPart($input) - throw error "$error"', async ({ input, error }) => {
            expect(() => generateGqlDataPartToOrganizationId(input)).toThrow(error)
        })
    })

    describe('generateGqlQueryToOrganizationIdAsString', () => {
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
            expect(generateGqlQueryToOrganizationIdAsString(listKey, pathToOrganizationId)).toEqual(output)
        })

        test.each(invalidCases)('generateGqlQueryAsString($input.listKey, $input.pathToOrganizationId) - throw error "$error"', async ({ input: { listKey, pathToOrganizationId }, error }) => {
            expect(() => generateGqlQueryToOrganizationIdAsString(listKey, pathToOrganizationId)).toThrow(error)
        })
    })

    describe('getFilterByOrganizationIds', () => {
        const organizationIds = [faker.datatype.uuid()]
        const validCases = [
            {
                input: {
                    pathToOrganizationId: ['a'],
                    organizationIds: [],
                },
                output: {
                    'a_in': [],
                    deletedAt: null,
                },
            },
            {
                input: {
                    pathToOrganizationId: ['a'],
                    organizationIds,
                },
                output: {
                    'a_in': organizationIds,
                    deletedAt: null,
                },
            },
            {
                input: {
                    pathToOrganizationId: ['a', 'b', 'c'],
                    organizationIds,
                },
                output: {
                    'a': {
                        'b': {
                            'c_in': organizationIds,
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
                    organizationIds,
                },
                output: {
                    'a': {
                        'b': {
                            'c': {
                                'd': {
                                    'e_in': organizationIds,
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
                    organizationIds,
                },
                error: '"pathToOrganizationId" must be not empty array!',
            },
            {
                input: {
                    pathToOrganizationId: null,
                    organizationIds,
                },
                error: '"pathToOrganizationId" must be not empty array!',
            },
            {
                input: {
                    pathToOrganizationId: ['a', 'b', 'c', 'd', 'e'],
                    organizationIds: null,
                },
                error: '"organizationId" must be array!',
            },
        ]

        test.each(validCases)('getFilter($input.pathToOrganizationId, $input.organizationIds) - returned valid value (%#)', async ({ input: { pathToOrganizationId, organizationIds }, output }) => {
            expect(getFilterByOrganizationIds(pathToOrganizationId, organizationIds)).toEqual(output)
        })

        test.each(invalidCases)('getFilter($input.pathToOrganizationId, $input.organizationIds) - throw error "$error"', async ({ input: { pathToOrganizationId, organizationIds }, error }) => {
            expect(() => getFilterByOrganizationIds(pathToOrganizationId, organizationIds)).toThrow(error)
        })
    })
})
