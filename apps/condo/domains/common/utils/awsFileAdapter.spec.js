/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const AWS = require('aws-sdk')

const { awsRouterHandler } = require('@open-condo/keystone/fileAdapter/awsFileAdapter')
const {
    setFakeClientMode,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    createTestBillingIntegration,
    createTestBillingIntegrationOrganizationContext,
} = require('@condo/domains/billing/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')


const { keystone } = index

const FOLDER_NAME = '__jest_test_api___'


class AwsTest {
    constructor (config) {
        this.bucket = config.bucket
        if (!this.bucket) {
            throw new Error('AwsAdapter: S3Adapter requires a bucket name.')
        }
        this.s3 = new AWS.S3(config.s3Options)
        this.folder = config.folder
    }

    async checkBucket () {
        try {
            await this.s3.headBucket({
                Bucket: this.bucket,
            }).promise()
            return true
        } catch (error) {
            console.error('Ошибка доступа к бакету:', error.code, error.message)
            return false
        }
    }

    async uploadObject (name, text) {
        const serverAnswer = await this.s3.upload({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
            Body: text,
        }).promise()
        return serverAnswer
    }

    async checkObjectExists (name) {
        try {
            const serverAnswer = await this.s3.headObject({
                Bucket: this.bucket,
                Key: `${this.folder}/${name}`,
            }).promise()
            return serverAnswer
        } catch (error){
            if (error.statusCode === 404) {
                return null
            }
            return error
            
        }
    }

    async deleteObject (name) {
        const serverAnswer = await this.s3.deleteObject({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
        }).promise()
        return serverAnswer
    }

    async getMeta (name) {
        const result = await this.s3.headObject({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
        }).promise()

        if (result?.Metadata) {
            return result.Metadata
        } else {
            return {}
        }
    }

    async setMeta (name, newMeta = {}) {
        try { 
            await this.s3.copyObject({
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${this.folder}/${name}`,
                Key: `${this.folder}/${name}`,
                Metadata: newMeta,
                MetadataDirective: 'REPLACE',
            }).promise()
            return true
        } catch (err) {
            return false
        }
    }


    static async initApi () {
        const S3Config = {
            ...(process.env.AWS_CONFIG ? JSON.parse(process.env.AWS_CONFIG) : {}),
            folder: FOLDER_NAME,
        }
        if (!S3Config.bucket) {
            console.warn('Aws Api: invalid configuration')
            return null
        }
        const Api = new AwsTest(S3Config)
        const check = await Api.checkBucket()
        if (!check) {
            console.warn(`Aws Api: no access to bucket ${Api.bucket}`)
            return null
        }
        return Api
    }
}

describe('Aws', () => {
    let handler
    let mockedNext, mockedReq, mockedRes

    setFakeClientMode(index)

    beforeAll(async () => {
        handler = awsRouterHandler({ keystone })
        mockedNext = () => {
            throw new Error('calling method not expected by test cases')
        }
        mockedReq = (file, user) => ({
            get: (header) => header,
            params: { file },
            user,
        })
        mockedRes = {
            sendStatus: mockedNext,
            status: mockedNext,
            end: mockedNext,
            json: mockedNext,
            redirect: mockedNext,
        }
    })

    describe('Aws SDK', () => {
        it('can add file to s3', async () => {
            const Api = await AwsTest.initApi()
            if (Api) {
                const name = `testFile_${Math.random()}.txt`
                const uploadedObject = await Api.uploadObject(name, `Random text ${Math.random()}`)

                expect(uploadedObject?.ETag).toBeDefined()
                expect(uploadedObject?.ETag?.length).toBeGreaterThan(0)
                expect(uploadedObject?.ServerSideEncryption).toBeDefined()
                expect(uploadedObject?.ServerSideEncryption?.length).toBeGreaterThan(0)

                const receivedObject = await Api.checkObjectExists(name)

                expect(receivedObject?.ETag).toBeDefined()
                expect(receivedObject?.ETag?.length).toBeGreaterThan(0)
                expect(receivedObject?.ETag).toEqual(uploadedObject?.ETag)
                expect(receivedObject?.ServerSideEncryption).toBeDefined()
                expect(receivedObject?.ServerSideEncryption?.length).toBeGreaterThan(0)
                expect(receivedObject?.ServerSideEncryption).toEqual(uploadedObject?.ServerSideEncryption)

                const deleteResponse = await Api.deleteObject(name)
                expect(deleteResponse).toEqual({})

                const objectAfterDeletion = await Api.checkObjectExists(name)
                expect(objectAfterDeletion).toBeNull()
            }
        })
        it('can set meta to a file', async () => {
            const Api = await AwsTest.initApi()
            if (Api) {
                const name = `testFile_${Math.random()}.txt`
                await Api.uploadObject(name, `Random text ${Math.random()}`)
                const setMetaResult = await Api.setMeta(name, { listkey: 'Some listkey', id: name })
                expect(setMetaResult).toBe(true)
                const meta = await Api.getMeta(name)
                expect(meta.listkey).toBe('Some listkey')
                expect(meta.id).toBe(name)
                await Api.deleteObject(name)
            }
        })
        it('can delete file from s3', async () => {
            const Api = await AwsTest.initApi()
            if (Api) {
                const name = `testFile_${Math.random()}.txt`
                const uploadedObject = await Api.uploadObject(name, `Random text ${Math.random()}`)
                expect(uploadedObject?.ETag).toBeDefined()
                expect(uploadedObject?.ETag?.length).toBeGreaterThan(0)
                expect(uploadedObject?.ServerSideEncryption).toBeDefined()
                expect(uploadedObject?.ServerSideEncryption?.length).toBeGreaterThan(0)

                const deleteResponse = await Api.deleteObject(name)
                expect(deleteResponse).toEqual({})

                const objectAfterDeletion = await Api.checkObjectExists(name)
                expect(objectAfterDeletion).toBeNull()
            }
        })

    })
    describe('Check access to read file', () => {
        let userClient, support, adminClient,
            integration, billingContext, Api,
            getFileWithMeta
        beforeAll(async () => {
            const Api = await AwsTest.initApi()
            if (Api) {
                userClient = await makeClientWithProperty()
                support = await makeClientWithSupportUser()
                adminClient = await makeLoggedInAdminClient()

                integration = (await createTestBillingIntegration(support))[0]
                billingContext = (await createTestBillingIntegrationOrganizationContext(userClient, userClient.organization, integration))[0]
            }
            getFileWithMeta = async (meta) => {
                const name = `testFile_${Math.random()}.txt` // NOSONAR
                const objectName = `${FOLDER_NAME}/${name}`
                await Api.uploadObject(name, `Random text ${Math.random()}`) // NOSONAR
                const setMetaResult = await Api.setMeta(name, meta)
                expect(setMetaResult).toBe(true)

                return {
                    name, objectName,
                }
            }

        })
        it('check access for read file by model', async () => {
            if (Api) {
                const { objectName } = await getFileWithMeta({
                    listkey: 'BillingIntegrationOrganizationContext',
                    id: billingContext.id,
                })

                handler(
                    mockedReq(objectName, adminClient.user),
                    { ...mockedRes, redirect: console.log },
                    mockedNext,
                )
            }
        })
        it('check access for read file by model param', async () => {
            if (Api) {
                const { objectName } = await getFileWithMeta({
                    listkey: 'BillingIntegrationOrganizationContext',
                    id: billingContext.id,
                    propertyquery: 'organization { id }',
                    propertyvalue: userClient.organization.id,
                })

                handler(
                    mockedReq(objectName, adminClient.user),
                    { ...mockedRes, redirect: console.log },
                    mockedNext,
                )
            }
        })

    })
})
