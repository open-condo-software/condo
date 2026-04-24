const { Readable } = require('stream')

const { faker } = require('@faker-js/faker')
const ObsClient = require('esdk-obs-nodejs')
const jwt = require('jsonwebtoken')

// Mock dependencies before imports
jest.mock('esdk-obs-nodejs')
jest.mock('@open-condo/config', () => ({
    SERVER_URL: 'https://example.com',
    SBERCLOUD_OBS_CONFIG: null,
    FILE_SECRET: 'test-secret',
}))
jest.mock('jsonwebtoken')

const mockLogger = {
    error: jest.fn(),
}

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn(() => mockLogger),
}))

const conf = require('@open-condo/config')

const { SberCloudFileAdapter } = require('./sberCloudFileAdapter')

describe('SberCloudFileAdapter', () => {
    let mockS3Client
    let config

    beforeEach(() => {
        jest.clearAllMocks()

        mockS3Client = {
            putObject: jest.fn(),
            deleteObject: jest.fn(),
        }

        ObsClient.mockImplementation(() => mockS3Client)

        config = {
            bucket: 'test-bucket',
            folder: 'test-folder',
            s3Options: {
                server: 'https://obs.test.com',
                access_key_id: 'test-key',
                secret_access_key: 'test-secret',
            },
            isPublic: false,
            saveFileName: false,
        }

        conf.SERVER_URL = 'https://example.com'
        conf.FILE_SECRET = 'test-secret'
    })

    describe('constructor', () => {
        it('should initialize with config', () => {
            const adapter = new SberCloudFileAdapter(config)

            expect(adapter.bucket).toBe('test-bucket')
            expect(adapter.folder).toBe('test-folder')
            expect(adapter.server).toBe('https://obs.test.com')
            expect(adapter.shouldResolveDirectUrl).toBe(false)
            expect(adapter.saveFileName).toBe(false)
            expect(adapter.s3).toBe(mockS3Client)
            expect(adapter.acl).toBeDefined()
            expect(adapter.acl.bucket).toBe('test-bucket')
        })

        it('should set shouldResolveDirectUrl from isPublic config', () => {
            const publicConfig = { ...config, isPublic: true }
            const adapter = new SberCloudFileAdapter(publicConfig)

            expect(adapter.shouldResolveDirectUrl).toBe(true)
        })
    })

    describe('errorFromCommonMsg', () => {
        it('should return Error when Status > 300', () => {
            const adapter = new SberCloudFileAdapter(config)
            const error = adapter.errorFromCommonMsg({
                CommonMsg: { Status: 404, Message: 'Not Found' },
            })

            expect(error).toBeInstanceOf(Error)
            expect(error.message).toBe('Not Found')
        })

        it('should return null when Status <= 300', () => {
            const adapter = new SberCloudFileAdapter(config)
            const error = adapter.errorFromCommonMsg({
                CommonMsg: { Status: 200, Message: 'OK' },
            })

            expect(error).toBeNull()
        })
    })

    describe('getFilename', () => {
        it('should generate filename from id and extension', () => {
            const adapter = new SberCloudFileAdapter(config)
            const id = faker.datatype.uuid()
            const result = adapter.getFilename({
                id,
                originalFilename: 'document.pdf',
            })

            expect(result).toBe(`${id}.pdf`)
        })

        it('should remove forbidden characters from extension', () => {
            const adapter = new SberCloudFileAdapter(config)
            const id = faker.datatype.uuid()
            const result = adapter.getFilename({
                id,
                originalFilename: 'file.p@d#f',
            })

            expect(result).toBe(`${id}.pdf`)
        })

        it('should handle files without extension', () => {
            const adapter = new SberCloudFileAdapter(config)
            const id = faker.datatype.uuid()
            const result = adapter.getFilename({
                id,
                originalFilename: 'noextension',
            })

            expect(result).toBe(id)
        })
    })

    describe('save', () => {
        it('should save file successfully', async () => {
            const adapter = new SberCloudFileAdapter(config)
            const stream = new Readable()
            stream.push('test data')
            stream.push(null)

            const fileData = {
                id: faker.datatype.uuid(),
                filename: 'test.pdf',
                mimetype: 'application/pdf',
                encoding: 'utf-8',
            }

            mockS3Client.putObject.mockImplementation((params, callback) => {
                callback(null, { CommonMsg: { Status: 200 } })
            })

            const result = await adapter.save({
                stream,
                ...fileData,
            })

            expect(result.id).toBe(fileData.id)
            expect(result.originalFilename).toBe('test.pdf')
            expect(result.mimetype).toBe('application/pdf')
            expect(mockS3Client.putObject).toHaveBeenCalled()
        })

        it('should handle save error', async () => {
            const adapter = new SberCloudFileAdapter(config)
            const stream = new Readable()
            stream.push('test data')
            stream.push(null)

            const error = new Error('Upload failed')
            mockS3Client.putObject.mockImplementation((params, callback) => {
                callback(error, null)
            })

            await expect(adapter.save({
                stream,
                id: faker.datatype.uuid(),
                filename: 'test.pdf',
                mimetype: 'application/pdf',
                encoding: 'utf-8',
            })).rejects.toThrow('Upload failed')
        })

        it('should skip upload if saveFileName is true and file exists', async () => {
            const saveFileNameConfig = { ...config, saveFileName: true }
            const adapter = new SberCloudFileAdapter(saveFileNameConfig)
            adapter.acl.getMeta = jest.fn().mockResolvedValue({ mimetype: 'application/pdf' })

            const stream = new Readable()
            stream.push('test data')
            stream.push(null)

            const result = await adapter.save({
                stream,
                id: faker.datatype.uuid(),
                filename: 'test.pdf',
                mimetype: 'application/pdf',
                encoding: 'utf-8',
            })

            expect(mockS3Client.putObject).not.toHaveBeenCalled()
            expect(result._meta).toEqual({ mimetype: 'application/pdf' })
        })
    })

    describe('delete', () => {
        it('should delete file successfully', async () => {
            const adapter = new SberCloudFileAdapter(config)
            const file = { filename: 'test.pdf' }

            mockS3Client.deleteObject.mockResolvedValue({ CommonMsg: { Status: 200 } })

            await adapter.delete(file)

            expect(mockS3Client.deleteObject).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: 'test-folder/test.pdf',
            })
        })

        it('should reject if file is not provided', async () => {
            const adapter = new SberCloudFileAdapter(config)

            await expect(adapter.delete(null)).rejects.toThrow('Missing required argument file.')
        })
    })

    describe('publicUrl', () => {
        it('should return direct URL when shouldResolveDirectUrl is true', () => {
            const publicConfig = { ...config, isPublic: true }
            const adapter = new SberCloudFileAdapter(publicConfig)
            const mockUrl = 'https://obs.test.com/signed-url'

            adapter.acl.generateUrl = jest.fn().mockReturnValue(mockUrl)

            const result = adapter.publicUrl({
                id: faker.datatype.uuid(),
                filename: 'test.pdf',
                originalFilename: 'document.pdf',
            })

            expect(result).toBe(mockUrl)
            expect(adapter.acl.generateUrl).toHaveBeenCalledWith({
                filename: 'test-folder/test.pdf',
                ttl: 60 * 60 * 24 * 30,
                originalFilename: 'document.pdf',
            })
        })

        it('should return indirect URL with original_filename when originalFilename is provided (BUG FIX TEST)', () => {
            const adapter = new SberCloudFileAdapter(config)
            const fileId = faker.datatype.uuid()

            const result = adapter.publicUrl({
                id: fileId,
                filename: 'test.pdf',
                originalFilename: 'my document.pdf',
            })

            expect(result).toContain('original_filename=')
            // Note: The implementation double-encodes (encodeURIComponent + URLSearchParams encoding)
            const doubleEncoded = encodeURIComponent(encodeURIComponent('my document.pdf'))
            expect(result).toContain(doubleEncoded)
            expect(result).toBe(`https://example.com/api/files/test-folder/test.pdf?original_filename=${doubleEncoded}`)
        })

        it('should return indirect URL without original_filename when originalFilename is null', () => {
            const adapter = new SberCloudFileAdapter(config)
            const fileId = faker.datatype.uuid()

            const result = adapter.publicUrl({
                id: fileId,
                filename: 'test.pdf',
                originalFilename: null,
            })

            expect(result).not.toContain('original_filename=')
            expect(result).toBe('https://example.com/api/files/test-folder/test.pdf')
        })

        it('should return indirect URL without original_filename when originalFilename is undefined', () => {
            const adapter = new SberCloudFileAdapter(config)
            const fileId = faker.datatype.uuid()

            const result = adapter.publicUrl({
                id: fileId,
                filename: 'test.pdf',
            })

            expect(result).not.toContain('original_filename=')
            expect(result).toBe('https://example.com/api/files/test-folder/test.pdf')
        })

        it('should handle special characters in originalFilename', () => {
            const adapter = new SberCloudFileAdapter(config)
            const fileId = faker.datatype.uuid()

            const result = adapter.publicUrl({
                id: fileId,
                filename: 'test.pdf',
                originalFilename: 'файл с пробелами & символами.pdf',
            })

            expect(result).toContain('original_filename=')
            // The implementation double-encodes (encodeURIComponent + URLSearchParams encoding)
            expect(result).toContain(encodeURIComponent(encodeURIComponent('файл с пробелами & символами.pdf')))
        })

        it('should add sign parameter for app files', () => {
            const adapter = new SberCloudFileAdapter(config)
            const fileId = faker.datatype.uuid()
            const mockSign = 'mock-jwt-token'

            jwt.sign = jest.fn().mockReturnValue(mockSign)

            const result = adapter.publicUrl({
                id: fileId,
                filename: 'test.pdf',
                originalFilename: 'document.pdf',
                meta: { fileClientId: 'test-app-id' },
            }, { id: 'user-id' })

            expect(result).toContain('sign=')
            expect(result).toContain(mockSign)
            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: fileId,
                    filename: 'test.pdf',
                    fileClientId: 'test-app-id',
                    user: { id: 'user-id' },
                },
                'test-secret',
                { expiresIn: '1h', algorithm: 'HS256' }
            )
        })

        it('should throw error if FILE_SECRET is not configured for app files', () => {
            const adapter = new SberCloudFileAdapter(config)
            conf.FILE_SECRET = undefined

            expect(() => {
                adapter.publicUrl({
                    id: faker.datatype.uuid(),
                    filename: 'test.pdf',
                    meta: { fileClientId: 'test-app-id' },
                })
            }).toThrow('FILE_SECRET is not configured')
        })
    })

    describe('uploadParams', () => {
        it('should return Metadata from meta', () => {
            const adapter = new SberCloudFileAdapter(config)
            const meta = { customKey: 'customValue' }

            const result = adapter.uploadParams({ meta })

            expect(result).toEqual({ Metadata: meta })
        })

        it('should return empty Metadata when meta is not provided', () => {
            const adapter = new SberCloudFileAdapter(config)

            const result = adapter.uploadParams({})

            expect(result).toEqual({ Metadata: {} })
        })
    })
})
