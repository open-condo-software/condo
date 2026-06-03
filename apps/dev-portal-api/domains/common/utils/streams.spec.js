const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { pipeline } = require('stream/promises')

const { faker } = require('@faker-js/faker')
const archiver = require('archiver')
const unzipper = require('unzipper')

const conf = require('@open-condo/config')

const { modifyZipStream } = require('./streams')

const BUILD_SRC_PATH = path.resolve(conf.PROJECT_ROOT, 'apps/dev-portal-api/domains/common/utils/testSchema/assets/build')

function createZip (srcDir, destPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(destPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', resolve)
        archive.on('error', reject)

        archive.pipe(output)
        archive.directory(srcDir, false)
        archive.finalize()
    })
}

function extractZip (zipPath, destDir) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(destDir, { recursive: true })
        fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: destDir }))
            .on('close', resolve)
            .on('error', reject)
    })
}

function hashFile (filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function listFiles (dirPath, base = dirPath) {
    const result = []
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        const abs = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
            result.push(...listFiles(abs, base))
        } else {
            result.push(path.relative(base, abs))
        }
    }
    return result
}

function getDirDiff (beforePath, afterPath) {
    // NOTE: Testing utils
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const beforeFiles = new Map(listFiles(beforePath).map(f => [f, hashFile(path.join(beforePath, f))]))
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const afterFiles = new Map(listFiles(afterPath).map(f => [f, hashFile(path.join(afterPath, f))]))
    const allPaths = new Set([...beforeFiles.keys(), ...afterFiles.keys()])
    const diff = []

    for (const filePath of allPaths) {
        const inBefore = beforeFiles.has(filePath)
        const inAfter = afterFiles.has(filePath)

        if (inBefore && !inAfter) {
            diff.push({ path: filePath, state: 'deleted' })
        } else if (!inBefore && inAfter) {
            diff.push({ path: filePath, state: 'added' })
        } else if (beforeFiles.get(filePath) !== afterFiles.get(filePath)) {
            diff.push({ path: filePath, state: 'modified' })
        }
    }

    return diff
}

describe('Streaming utils', () => {
    describe('modifyZipStream', () => {
        let tmpDir
        let sourceZipPath
        let outputZipPath
        let outputDir

        beforeEach(async () => {
            const runId = faker.datatype.uuid()
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `streams-spec-${runId}`))
            sourceZipPath = path.join(tmpDir, 'source.zip')
            outputZipPath = path.join(tmpDir, 'output.zip')
            outputDir = path.join(tmpDir, 'output')
            await createZip(BUILD_SRC_PATH, sourceZipPath)
        })

        afterEach(() => {
            fs.rmSync(tmpDir, { recursive: true, force: true })
        })

        test('rewrites matched file content', async () => {
            const newContent = faker.lorem.paragraph()
            const inputStream = fs.createReadStream(sourceZipPath)
            const matcher = /^.+\.txt$/
            const outputStream = modifyZipStream(inputStream, {
                entries: [
                    {
                        match: (ctx) => matcher.test(ctx.path),
                        process: async (ctx) => {
                            const existing = await ctx.entry.buffer()
                            return existing.toString('utf8') + '\n\n' + newContent
                        },
                    },
                ],
            })

            await pipeline(outputStream, fs.createWriteStream(outputZipPath))
            await extractZip(outputZipPath, outputDir)

            const diff = getDirDiff(BUILD_SRC_PATH, outputDir)
            expect(diff).toEqual([{ path: 'www/hello.txt', state: 'modified' }])

            const originalContent = fs.readFileSync(path.join(BUILD_SRC_PATH, 'www/hello.txt'), 'utf8')
            const writtenContent = fs.readFileSync(path.join(outputDir, 'www/hello.txt'), 'utf8')
            expect(writtenContent).toBe(originalContent + '\n\n' + newContent)
        })

        test('afterEntries: overwrites existing file when it is present in the zip', async () => {
            const newContent = faker.lorem.paragraph()
            const inputStream = fs.createReadStream(sourceZipPath)
            const outputStream = modifyZipStream(inputStream, {
                afterEntries: ({ append, hasEntry }) => {
                    if (hasEntry('www/hello.txt')) {
                        append({ path: 'www/hello.txt', content: newContent })
                    }
                },
            })

            await pipeline(outputStream, fs.createWriteStream(outputZipPath))
            await extractZip(outputZipPath, outputDir)

            const diff = getDirDiff(BUILD_SRC_PATH, outputDir)
            expect(diff).toEqual([{ path: 'www/hello.txt', state: 'modified' }])

            const writtenContent = fs.readFileSync(path.join(outputDir, 'www/hello.txt'), 'utf8')
            expect(writtenContent).toBe(newContent)
        })

        test('afterEntries: creates new file when it is not present in the zip', async () => {
            const config = { version: faker.system.semver(), buildId: faker.datatype.uuid() }
            const inputStream = fs.createReadStream(sourceZipPath)
            const outputStream = modifyZipStream(inputStream, {
                afterEntries: ({ append, hasEntry }) => {
                    if (!hasEntry('www/config.json')) {
                        append({ path: 'www/config.json', content: JSON.stringify(config) })
                    }
                },
            })

            await pipeline(outputStream, fs.createWriteStream(outputZipPath))
            await extractZip(outputZipPath, outputDir)

            const diff = getDirDiff(BUILD_SRC_PATH, outputDir)
            expect(diff).toEqual([{ path: 'www/config.json', state: 'added' }])

            const writtenContent = fs.readFileSync(path.join(outputDir, 'www/config.json'), 'utf8')
            expect(JSON.parse(writtenContent)).toEqual(config)
        })

        test('passes through zip unchanged when no entries options provided', async () => {
            const inputStream = fs.createReadStream(sourceZipPath)
            const outputStream = modifyZipStream(inputStream)

            await pipeline(outputStream, fs.createWriteStream(outputZipPath))
            await extractZip(outputZipPath, outputDir)

            const outputStat = fs.statSync(outputZipPath)
            expect(outputStat.size).toBeGreaterThan(0)

            expect(getDirDiff(BUILD_SRC_PATH, outputDir)).toEqual([])
        })
    })
})
