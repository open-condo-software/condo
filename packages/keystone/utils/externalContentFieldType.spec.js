const { createExternalDataField, isFileMeta } = require('./externalContentFieldType')

describe('externalContentFieldType utils', () => {
    test('createExternalDataField forces type=ExternalContent even if input had type=Json', () => {
        const field = createExternalDataField({
            type: 'Json',
            adapter: { save: async () => ({}), delete: async () => undefined },
            format: 'json',
        })

        expect(field.type).toBe('ExternalContent')
    })

    test('isFileMeta detects file-meta objects', () => {
        expect(isFileMeta({ id: '1', filename: 'a' })).toBe(true)
        expect(isFileMeta({ id: '', filename: 'a' })).toBe(false)
        expect(isFileMeta({ id: '1', filename: '' })).toBe(false)
        expect(isFileMeta(null)).toBe(false)
        expect(isFileMeta([])).toBe(false)
    })
})

