/**
 * @jest-environment node
 */

require('@app/condo/index')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { DIRECT_ACCESS_AVAILABLE_SCHEMAS } = require('./config')


function capitalize (input) {
    return `${input.charAt(0).toUpperCase()}${input.slice(1)}`
}

describe('DIRECT_ACCESS_AVAILABLE_SCHEMAS config', () => {

    describe('Schema names validation', () => {
        const schemaNames = DIRECT_ACCESS_AVAILABLE_SCHEMAS.lists.map(item => {
            return item.schemaName || item
        })

        it.each(schemaNames)('schema "%s" should exist in registered schemas', (schemaName) => {
            const schema = getSchemaCtx(schemaName)
            expect(schema).toBeDefined()
            expect(schema.name).toBe(schemaName)
        })

        test('mentioning non existing schema "BillingOrganizationIntegrationContext" should throw error', () => {
            expect(() => getSchemaCtx('BillingOrganizationIntegrationContext')).toThrow('Schema BillingOrganizationIntegrationContext is not registered yet')
        })
    })

    describe('Field schema names validation', () => {
        const schemaFieldPairs = Object.keys(DIRECT_ACCESS_AVAILABLE_SCHEMAS.fields).reduce((acc, schemaName) => {
            const fields = DIRECT_ACCESS_AVAILABLE_SCHEMAS.fields[schemaName]
            return acc.concat(fields.map((fieldData) => [schemaName, fieldData.fieldName]))
        }, [])

        it.each(schemaFieldPairs)('schema "%s" should exist and have field "%s"', (schemaName, fieldName) => {
            const schema = getSchemaCtx(schemaName)
            expect(schema).toBeDefined()
            expect(schema.name).toBe(schemaName)

            const fields = schema.list.fieldsByPath
            const fieldsNames = Object.keys(fields)
            expect(fieldsNames).toContain(fieldName)
        })
    })

    describe('Service names validation', () => {
        // Some services has different names in config and in registered schemas
        const mapping = new Map([
            ['_allBillingReceiptsSum', 'SumBillingReceiptsService'],
            ['_allPaymentsSum', 'SumPaymentsService'],
        ])

        // Build service names array
        const serviceNames = DIRECT_ACCESS_AVAILABLE_SCHEMAS.services.map((s) => {
            if (mapping.has(s)){
                return mapping.get(s)
            }

            return `${capitalize(s)}Service`
        })

        it.each(serviceNames)('service "%s" should exist in registered services', (serviceName) => {
            expect(() => getSchemaCtx(serviceName)).not.toThrow()
        })

        test('mentioning non existing service "CastLumosService" should throw error', () => {
            expect(() => getSchemaCtx('CastLumosService')).toThrow('Schema CastLumosService is not registered yet')
        })
    })

    describe('Config structure validation', () => {
        it('should have lists array', () => {
            expect(DIRECT_ACCESS_AVAILABLE_SCHEMAS.lists).toBeDefined()
            expect(Array.isArray(DIRECT_ACCESS_AVAILABLE_SCHEMAS.lists)).toBe(true)
        })

        it('should have fields object', () => {
            expect(DIRECT_ACCESS_AVAILABLE_SCHEMAS.fields).toBeDefined()
            expect(typeof DIRECT_ACCESS_AVAILABLE_SCHEMAS.fields).toBe('object')
        })

        it('should have services array', () => {
            expect(DIRECT_ACCESS_AVAILABLE_SCHEMAS.services).toBeDefined()
            expect(Array.isArray(DIRECT_ACCESS_AVAILABLE_SCHEMAS.services)).toBe(true)
        })
    })
})
