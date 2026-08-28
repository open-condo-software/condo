const fs = require('fs')
const os = require('os')
const path = require('path')

jest.mock('@open-condo/config', () => ({}))

const { LocalFileAdapter } = require('./fileAdapter')

const CONTENT = Buffer.from('0123456789abcdef')

describe('LocalFileAdapter ranged reads', () => {
    let directory
    let adapter
    const file = { filename: 'registry.txt' }

    beforeEach(() => {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'local-file-adapter-'))
        fs.writeFileSync(path.join(directory, file.filename), CONTENT)
        adapter = new LocalFileAdapter({ src: directory, path: '', mediaPath: '' })
    })

    afterEach(() => {
        fs.rmSync(directory, { recursive: true, force: true })
    })

    it('gets size and reads an exact byte range', async () => {
        await expect(adapter.getFileSize(file)).resolves.toBe(CONTENT.length)
        await expect(adapter.readRange(file, 2, 4)).resolves.toEqual(CONTENT.subarray(2, 6))
    })

    it('creates a stream with the complete file', async () => {
        await expect(streamToBuffer(adapter.createReadStream(file))).resolves.toEqual(CONTENT)
    })
})

async function streamToBuffer (stream) {
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    return Buffer.concat(chunks)
}
