const path = require('node:path')

const { validateFilePath } = require('./validateFilePath')

describe('validateFilePath', () => {
    test('allows valid filename', () => {
        const basePath = '/test/path'
        const filename = 'file.json'

        const result = validateFilePath(basePath, filename)

        expect(result).toBe(path.join(basePath, filename))
    })

    test('allows filename with subdirectory', () => {
        const basePath = '/test/path'
        const filename = 'subdir/file.json'

        const result = validateFilePath(basePath, filename)

        expect(result).toBe(path.join(basePath, filename))
    })

    test('blocks path traversal with ../', () => {
        const basePath = '/test/path'
        const filename = '../../../etc/passwd'

        expect(() => validateFilePath(basePath, filename))
            .toThrow('path traversal detected')
    })

    test('blocks path traversal with absolute path', () => {
        const basePath = '/test/path'
        const filename = '/etc/passwd'

        expect(() => validateFilePath(basePath, filename))
            .toThrow('path traversal detected')
    })

    test('blocks path traversal with mixed patterns', () => {
        const basePath = '/test/path'
        const filename = 'subdir/../../etc/passwd'

        expect(() => validateFilePath(basePath, filename))
            .toThrow('path traversal detected')
    })

    test('blocks filename that resolves to base directory', () => {
        const basePath = '/test/path'
        const filename = '.'

        expect(() => validateFilePath(basePath, filename))
            .toThrow('cannot resolve to base directory')
    })

    test('blocks Windows-style absolute paths', () => {
        const basePath = '/test/path'
        const filename = 'C:\\Windows\\System32\\config'

        // On Unix, this is treated as absolute if path.isAbsolute returns true
        // On Windows, this will be caught
        if (path.isAbsolute(filename)) {
            expect(() => validateFilePath(basePath, filename))
                .toThrow('path traversal detected')
        }
    })

    test('handles normalized paths correctly', () => {
        const basePath = '/test/path'
        const filename = './subdir/../file.json'

        const result = validateFilePath(basePath, filename)

        // Should normalize to /test/path/file.json
        expect(result).toBe(path.join(basePath, 'file.json'))
    })

    test('rejects empty basePath', () => {
        expect(() => validateFilePath('', 'file.json'))
            .toThrow('Invalid basePath')
    })

    test('rejects empty filename', () => {
        expect(() => validateFilePath('/test/path', ''))
            .toThrow('Invalid filename')
    })

    test('rejects null basePath', () => {
        expect(() => validateFilePath(null, 'file.json'))
            .toThrow('Invalid basePath')
    })

    test('rejects null filename', () => {
        expect(() => validateFilePath('/test/path', null))
            .toThrow('Invalid filename')
    })
})
