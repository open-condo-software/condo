const ObsClient = require('esdk-obs-nodejs')
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

    async uploadObject (name, text) {
        const serverAnswer = await this.obs.putObject({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
            Body: text,
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
}

const initApi = () => {
    const API = new SberCloudObsTest({
        ...(process.env.SBERCLOUD_OBS_CONFIG ? JSON.parse(process.env.SBERCLOUD_OBS_CONFIG) : {}),
        folder: FOLDER_NAME,
    })
    return API
}

describe('Sbercloud OBS API', () => {
    test('Add File (and remove after add)', async () => {
        const name = `testFile_${Math.random}.txt`
        const API = initApi()
        const { CommonMsg: { Status: createStatus } } = await API.uploadObject(name, `Random text ${Math.random()}`)
        expect(createStatus).toBe(200)
        const { CommonMsg: { Status: deleteStatus } } = await API.deleteObject(name)
        expect(deleteStatus).toBe(204)
    })
})
