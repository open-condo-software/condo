const fs = require('fs')

const { faker } = require('@faker-js/faker')
const FormData = require('form-data')
const jwt = require('jsonwebtoken')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getKVClient } = require('@open-condo/keystone/kv')
const { makeClient, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const DV_AND_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'test-runner' } }

const FileMiddlewareTests = (testFile, UserSchema, createTestUser) => {
    const appClients = JSON.parse(conf['FILE_UPLOAD_CONFIG']).clients
    const appId = Object.keys(appClients)[0]
    let serverUrl
    let admin
    let filestream
    beforeAll(async () => {
        // Clean rate limits
        const kv = getKVClient('guards')

        const client = await makeClient()
        serverUrl = client.serverUrl + '/api/files/upload'
        admin = await makeLoggedInAdminClient()
        filestream = fs.readFileSync(testFile)

        console.log(admin.user.id)

        // Clear rate limits
        await kv.del(`guard_counter:file:${admin.user.id}`)
        await kv.del('guard_counter:file:::ffff:127.0.0.1')
    })

    describe('file middleware', () => {
        describe('security', () => {
            test('Unauthorized request should fail with 403 error', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                })
                const json = await result.json()

                expect(result.status).toEqual(401)
                expect(json).toEqual({
                    errors: [
                        expect.objectContaining({
                            name: 'GQLError',
                            message: 'Authorization is required',
                        }),
                    ],
                })
            })

            test('Deleted user should not be able to upload file', async () => {
                const deletedUser = await createTestUser()
                const cookie = deletedUser.getCookie()
                await UserSchema.softDelete(admin, deletedUser.user.id)
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                const result = await fetch(serverUrl, {
                    headers: { Cookie: cookie },
                    method: 'POST',
                    body: form,
                })
                const json = await result.json()
                expect(result.status).toEqual(401)
                expect(json).toEqual({
                    errors: [
                        expect.objectContaining({
                            name: 'GQLError',
                            message: 'Authorization is required',
                        }),
                    ],
                })
            })

            test('User should not be able to upload file for another user', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({
                    authedItem: faker.datatype.uuid(),
                    appId,
                    modelNames: ['SomeModel'],
                    ...DV_AND_SENDER,
                }))

                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toEqual({
                    errors: [
                        expect.objectContaining({
                            name: 'GQLError',
                            message: 'Wrong authedItem. Unable to upload file for another user',
                        }),
                    ],
                })
            })

            test('Only POST request is allowed', async () => {
                const result = await fetch(serverUrl, { method: 'GET' })
                expect(result.status).toEqual(404)
            })

            test('Strict match url pattern', async () => {
                const result = await fetch(serverUrl + '/something/else', {
                    method: 'POST',
                })
                expect(result.status).toEqual(404)
            })
        })

        describe('validation', () => {
            test('Request type should be "multipart/form-data"', async () => {
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: {},
                    headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toEqual({
                    errors: [
                        expect.objectContaining({
                            name: 'GQLError',
                            message: 'Wrong request method type. Only "multipart/form-data" is allowed',
                        }),
                    ],
                })
            })

            test('upload file without required meta field should be not possible', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })

                expect(result.status).toEqual(400)
            })

            test('upload file without dv field should fail', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: admin.user.id }))
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })

                expect(result.status).toEqual(400)
            })

            test('upload without sender meta field should fail', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: admin.user.id, dv: 1 }))
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })

                expect(result.status).toEqual(400)
            })

            test('upload with wrong data version number should fail', async () => {
                let form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: admin.user.id, dv: 2, sender: { dv: 1, fingerprint: 'test-runner' } }))
                let result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                expect(result.status).toEqual(400)

                form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: admin.user.id, dv: 1, sender: { dv: 2, fingerprint: 'test-runner' } }))
                result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })

                expect(result.status).toEqual(400)
            })

            test('upload with wrong meta.sender.fingerprint should fail', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: admin.user.id, dv: 1, sender: { dv: 1, fingerprint: 'test' } }))
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })

                expect(result.status).toEqual(400)
            })

            test('upload without file should fail', async () => {
                const form = new FormData()
                form.append('meta', JSON.stringify({ authedItem: admin.user.id, appId, modelNames: ['SomeModel'], ...DV_AND_SENDER }))
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toEqual({
                    errors: [
                        expect.objectContaining({
                            name: 'GQLError',
                            message: 'Missing binary data in request',
                        }),
                    ],
                })
            })

            test('upload with wrong authed item type should fail', async () => {
                const form = new FormData()
                form.append('meta', JSON.stringify({ authedItem: 123, ...DV_AND_SENDER }))
                form.append('file', fs.readFileSync(testFile), 'dino.png')
                const result = await fetch(serverUrl, {
                    method: 'POST', body: form, headers: { Cookie: admin.getCookie() },
                })

                expect(result.status).toEqual(400)
            })

            test('upload without app id should fail', async () => {
                const form = new FormData()
                form.append('file', fs.readFileSync(testFile), 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: admin.user.id, ...DV_AND_SENDER }))
                const result = await fetch(serverUrl, {
                    method: 'POST', body: form, headers: { Cookie: admin.getCookie() },
                })

                expect(result.status).toEqual(400)
            })

            test('upload with wrong appId should fail', async () => {
                const appId = faker.datatype.uuid()
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: admin.user.id, appId, modelNames: ['SomeModel'], ...DV_AND_SENDER }))
                const result = await fetch(serverUrl, {
                    method: 'POST', body: form, headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()
                expect(result.status).toEqual(403)
                expect(json).toEqual({
                    errors: [
                        expect.objectContaining({
                            name: 'GQLError',
                            message: 'Provided appId does not have permission to upload file',
                        }),
                    ],
                })
            })
        })

        describe('signature', () => {
            test('signed file must be decryptable', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    authedItem: user.user.id,
                    appId,
                    modelNames: ['SomeModel'],
                    ...DV_AND_SENDER,
                }
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify(meta))

                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: user.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(200)
                expect(json).toHaveProperty(['data', 'files'])
                expect(json.data.files).toHaveLength(1)
                expect(json.data.files[0]).toHaveProperty('id')
                expect(json.data.files[0]).toHaveProperty('signature')

                const secret = JSON.parse(conf['FILE_UPLOAD_CONFIG']).clients[meta.appId]['secret']
                const data = jwt.verify(json.data.files[0].signature, secret)
                expect(data).not.toBeNull()
            })
        })

        describe('api', () => {
            test('successful upload should return file id', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    authedItem: user.user.id,
                    appId,
                    modelNames: ['SomeModel'],
                    ...DV_AND_SENDER,
                }
                form.append('meta', JSON.stringify(meta))
                form.append('file', filestream, 'dino.png')

                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: user.getCookie() },
                })

                const json = await result.json()

                expect(result.status).toEqual(200)
                expect(json.data.files).toHaveLength(1)
                expect(json.data.files[0]).toHaveProperty('signature')
                expect(json.data.files[0]).toHaveProperty('id')
                expect(json.data.files[0]).toHaveProperty('fileMeta')
                expect(json.data.files[0].fileMeta).toHaveProperty(['meta', 'fileAdapter'], conf['FILE_FIELD_ADAPTER'])
            })

            test('uploading multiple files should be possible', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    authedItem: user.user.id,
                    appId,
                    modelNames: ['SomeModel'],
                    ...DV_AND_SENDER,
                }
                form.append('meta', JSON.stringify(meta))
                form.append('file', filestream, 'dino.png')
                form.append('file', filestream, 'dino1.png')

                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: user.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(200)
                expect(json.data.files).toHaveLength(2)
            })
        })
    })
}

module.exports = {
    FileMiddlewareTests,
}
