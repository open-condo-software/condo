const { createExternalDataField } = require('./createExternalDataField')

describe('createExternalDataField', () => {
    test('forces type=ExternalContent even if input had type=Json', () => {
        const field = createExternalDataField({
            type: 'Json',
            adapter: { save: async () => ({}), delete: async () => undefined },
            format: 'json',
        })

        expect(field.type).toBe('ExternalContent')
    })

    test('creates field with default format', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }
        const field = createExternalDataField({ adapter })

        expect(field.format).toBe('json')
        expect(field.type).toBe('ExternalContent')
    })

    test('throws error when adapter is missing', () => {
        expect(() => createExternalDataField({ format: 'json' }))
            .toThrow('adapter is required')
    })

    test('throws error when maxSizeBytes is invalid', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }

        expect(() => createExternalDataField({ adapter, maxSizeBytes: -1 }))
            .toThrow('maxSizeBytes must be a positive number')

        expect(() => createExternalDataField({ adapter, maxSizeBytes: 'invalid' }))
            .toThrow('maxSizeBytes must be a positive number')
    })

    test('throws error when batchDelayMs is invalid', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }

        expect(() => createExternalDataField({ adapter, batchDelayMs: -1 }))
            .toThrow('batchDelay must be a non-negative number')

        expect(() => createExternalDataField({ adapter, batchDelayMs: 'invalid' }))
            .toThrow('batchDelay must be a non-negative number')
    })

    test('includes maxSizeBytes when provided', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }
        const field = createExternalDataField({ adapter, maxSizeBytes: 1024 })

        expect(field.maxSizeBytes).toBe(1024)
    })

    test('includes batchDelayMs when provided', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }
        const field = createExternalDataField({ adapter, batchDelayMs: 20 })

        expect(field.batchDelayMs).toBe(20)
    })

    test('includes custom schemaDoc', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }
        const schemaDoc = 'Custom field description'
        const field = createExternalDataField({ adapter, schemaDoc })

        expect(field.schemaDoc).toBe(schemaDoc)
    })

    test('includes other properties passed in', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }
        const field = createExternalDataField({
            adapter,
            sensitive: true,
            isRequired: false,
        })

        expect(field.sensitive).toBe(true)
        expect(field.isRequired).toBe(false)
    })

    test('adminConfig.isReadOnly defaults to true when isAdminUIReadOnly is not provided', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }
        const field = createExternalDataField({ adapter })

        expect(field.adminConfig).toEqual({ isReadOnly: true })
    })

    test('adminConfig.isReadOnly is false when isAdminUIReadOnly is false', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }
        const field = createExternalDataField({ adapter, isAdminUIReadOnly: false })

        expect(field.adminConfig).toEqual({ isReadOnly: false })
    })

    test('adminConfig.isReadOnly is true when isAdminUIReadOnly is true', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }
        const field = createExternalDataField({ adapter, isAdminUIReadOnly: true })

        expect(field.adminConfig).toEqual({ isReadOnly: true })
    })

    test('isAdminUIReadOnly is not leaked into the returned field object', () => {
        const adapter = { save: async () => ({}), delete: async () => undefined }
        const field = createExternalDataField({ adapter, isAdminUIReadOnly: false })

        expect(field).not.toHaveProperty('isAdminUIReadOnly')
    })
})
