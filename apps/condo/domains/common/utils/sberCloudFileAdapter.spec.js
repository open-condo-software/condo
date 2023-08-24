/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const ObsClient = require('esdk-obs-nodejs')

const {
    setFakeClientMode,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    createTestBillingIntegrationOrganizationContext,
} = require('@condo/domains/billing/utils/testSchema')
const {
    createTestBillingIntegration,
} = require('@condo/domains/billing/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const {
    makeClientWithSupportUser,
} = require('@condo/domains/user/utils/testSchema')

const { obsRouterHandler } = require('./sberCloudFileAdapter')

const { keystone } = index

const FOLDER_NAME = '__jest_test_api___'


class SberCloudObsTest {
    constructor (config) {
        this.bucket = config.bucket
        if (!this.bucket) {
            throw new Error('SberCloudAdapter: S3Adapter requires a bucket name.')
        }
        this.obs = new ObsClient(config.s3Options)
        this.folder = config.folder
    }

    async checkBucket () {
        const { CommonMsg: { Status: bucketStatus } } = await this.obs.headBucket({
            Bucket: this.bucket,
        })
        return bucketStatus === 200
    }

    async uploadObject (name, text) {
        const serverAnswer = await this.obs.putObject({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
            Body: text,
        })
        return serverAnswer
    }

    async checkObjectExists (name) {
        const serverAnswer = await this.obs.getObjectMetadata({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
        })
        return serverAnswer
    }

    async deleteObject (name) {
        const serverAnswer = await this.obs.deleteObject({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
        })
        return serverAnswer
    }

    async getMeta (name) {
        const result = await this.obs.getObjectMetadata({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
        })
        if (result.CommonMsg.Status < 300) {
            return result.InterfaceResult.Metadata
        } else {
            return {}
        }
    }

    async setMeta (name, newMeta = {}) {
        const result = await this.obs.setObjectMetadata({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
            Metadata: newMeta,
            MetadataDirective: 'REPLACE_NEW',
        })
        const { CommonMsg: { Status } } = result
        return Status < 300
    }

    static async initApi () {
        const S3Config = {
            ...(process.env.SBERCLOUD_OBS_CONFIG ? JSON.parse(process.env.SBERCLOUD_OBS_CONFIG) : {}),
            folder: FOLDER_NAME,
        }
        if (!S3Config.bucket) {
            console.warn('SberCloud Api: invalid configuration')
            return null
        }
        const Api = new SberCloudObsTest(S3Config)
        const check = await Api.checkBucket()
        if (!check) {
            console.warn(`SberCloud Api: no access to bucket ${Api.bucket}`)
            return null
        }
        return Api
    }
}


describe('Sbercloud', () => {
    let handler
    let mockedNext, mockedReq, mockedRes

    setFakeClientMode(index)

    beforeAll(async () => {
        handler = obsRouterHandler({ keystone })
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

    describe('Huawei SDK', () => {
        it('can add file to s3', async () => {
            const Api = await SberCloudObsTest.initApi()
            if (Api) {
                const name = `testFile_${Math.random()}.txt`
                const { CommonMsg: { Status: createStatus } } = await Api.uploadObject(name, `Random text ${Math.random()}`)
                expect(createStatus).toBe(200)
                const { CommonMsg: { Status: checkStatus } } = await Api.checkObjectExists(name)
                expect(checkStatus).toBe(200)
                const { CommonMsg: { Status: deleteStatus } } = await Api.deleteObject(name)
                expect(deleteStatus).toBe(204)
            }
        })
        it('can set meta to a file', async () => {
            const Api = await SberCloudObsTest.initApi()
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
            const Api = await SberCloudObsTest.initApi()
            if (Api) {
                const name = `testFile_${Math.random()}.txt`
                const { CommonMsg: { Status: createStatus } } = await Api.uploadObject(name, `Random text ${Math.random()}`)
                expect(createStatus).toBe(200)
                const { CommonMsg: { Status: deleteStatus } } = await Api.deleteObject(name)
                expect(deleteStatus).toBe(204)
                const { CommonMsg: { Status: checkStatus } } = await Api.checkObjectExists(name)
                expect(checkStatus).toBe(404)
            }
        })
    })
    describe('Check access to read file', () => {
        let userClient, support, adminClient,
            integration, billingContext, Api,
            getFileWithMeta

        beforeAll(async () => {
            Api = await SberCloudObsTest.initApi()
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
