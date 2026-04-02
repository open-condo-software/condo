const { isFileMeta } = require('./isFileMeta')

describe('isFileMeta', () => {
    test('detects valid file-meta objects', () => {
        expect(isFileMeta({ id: '1', filename: 'a' })).toBe(true)
        expect(isFileMeta({ id: 'abc123', filename: 'file.json' })).toBe(true)
    })

    test('rejects objects with empty id', () => {
        expect(isFileMeta({ id: '', filename: 'a' })).toBe(false)
    })

    test('rejects objects with empty filename', () => {
        expect(isFileMeta({ id: '1', filename: '' })).toBe(false)
    })

    test('rejects null values', () => {
        expect(isFileMeta(null)).toBe(false)
    })

    test('rejects arrays', () => {
        expect(isFileMeta([])).toBe(false)
    })

    test('rejects non-objects', () => {
        expect(isFileMeta('string')).toBe(false)
        expect(isFileMeta(123)).toBe(false)
        expect(isFileMeta(true)).toBe(false)
    })

    test('accepts objects with _type marker', () => {
        expect(isFileMeta({
            _type: 'ExternalContent.file-meta',
            id: '1',
            filename: 'file.json',
        })).toBe(true)
    })

    test('rejects objects with wrong _type', () => {
        expect(isFileMeta({
            _type: 'WrongType',
            id: '1',
            filename: 'file.json',
        })).toBe(false)
    })

    test('accepts optional properties', () => {
        expect(isFileMeta({
            id: '1',
            filename: 'file.json',
            mimetype: 'application/json',
            originalFilename: 'original.json',
            encoding: 'utf-8',
            meta: { custom: 'value' },
        })).toBe(true)
    })

    test('rejects objects with unknown properties', () => {
        expect(isFileMeta({
            id: '1',
            filename: 'file.json',
            unknownProperty: 'value',
        })).toBe(false)
    })

    test('allows empty strings when requireNonEmpty is false', () => {
        expect(isFileMeta(
            { id: '', filename: 'file.json' },
            { requireNonEmpty: false }
        )).toBe(true)

        expect(isFileMeta(
            { id: '1', filename: '' },
            { requireNonEmpty: false }
        )).toBe(true)
    })
})
