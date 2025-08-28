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
    let serverShareUrl
    let admin
    let filestream
    beforeAll(async () => {
        // Clean rate limits
        const kv = getKVClient('guards')

        const client = await makeClient()
        serverUrl = client.serverUrl + '/api/files/upload'
        serverShareUrl = client.serverUrl + '/api/files/share'
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
                    authedItemId: faker.datatype.uuid(),
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
                            message: 'Wrong authedItemId. Unable to upload file for another user',
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
            describe('upload', () => {
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
                    form.append('meta', JSON.stringify({ authedItemId: admin.user.id }))
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
                    form.append('meta', JSON.stringify({ authedItemId: admin.user.id, dv: 1 }))
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
                    form.append('meta', JSON.stringify({ authedItemId: admin.user.id, dv: 2, sender: { dv: 1, fingerprint: 'test-runner' } }))
                    let result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: admin.getCookie() },
                    })
                    expect(result.status).toEqual(400)

                    form = new FormData()
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify({ authedItemId: admin.user.id, dv: 1, sender: { dv: 2, fingerprint: 'test-runner' } }))
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
                    form.append('meta', JSON.stringify({ authedItemId: admin.user.id, dv: 1, sender: { dv: 1, fingerprint: 'test' } }))
                    const result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: admin.getCookie() },
                    })

                    expect(result.status).toEqual(400)
                })

                test('upload without file should fail', async () => {
                    const form = new FormData()
                    form.append('meta', JSON.stringify({ authedItemId: admin.user.id, appId, modelNames: ['SomeModel'], ...DV_AND_SENDER }))
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
                    form.append('meta', JSON.stringify({ authedItemId: 123, ...DV_AND_SENDER }))
                    form.append('file', fs.readFileSync(testFile), 'dino.png')
                    const result = await fetch(serverUrl, {
                        method: 'POST', body: form, headers: { Cookie: admin.getCookie() },
                    })

                    expect(result.status).toEqual(400)
                })

                test('upload without app id should fail', async () => {
                    const form = new FormData()
                    form.append('file', fs.readFileSync(testFile), 'dino.png')
                    form.append('meta', JSON.stringify({ authedItemId: admin.user.id, ...DV_AND_SENDER }))
                    const result = await fetch(serverUrl, {
                        method: 'POST', body: form, headers: { Cookie: admin.getCookie() },
                    })

                    expect(result.status).toEqual(400)
                })

                test('upload with wrong appId should fail', async () => {
                    const appId = faker.datatype.uuid()
                    const form = new FormData()
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify({ authedItemId: admin.user.id, appId, modelNames: ['SomeModel'], ...DV_AND_SENDER }))
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

            describe('share', () => {
                test('only authorized user can share file', async () => {
                    const result = await fetch(serverShareUrl, {
                        method: 'POST',
                        body: JSON.stringify({}),
                        headers: { 'Content-Type': 'application/json' },
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

                test('only owner of the binary can share', async () => {
                    const user1 = await createTestUser()
                    const user2 = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        authedItemId: user1.user.id,
                        appId, modelNames: ['SomeModel'],
                        ...DV_AND_SENDER,
                    }
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify(meta))

                    const uploadResult = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: user1.getCookie() },
                    })
                    expect(uploadResult.status).toEqual(200)
                    const uploadResultJson = await uploadResult.json()
                    expect(uploadResultJson.data.files).toHaveLength(1)
                    expect(uploadResultJson.data.files[0]).toHaveProperty('id')

                    const result = await fetch(serverShareUrl, {
                        method: 'POST',
                        body: JSON.stringify({
                            id: uploadResultJson.data.files[0].id,
                            appId: Object.keys(appClients)[1],
                            authedItemId: user2.user.id,
                            modelNames: ['AnotherModel'],
                            ...DV_AND_SENDER,
                        }),
                        // Here should be user1 - file owner
                        headers: { Cookie: user2.getCookie(), 'Content-Type': 'application/json' },
                    })
                    const json = await result.json()
                    expect(result.status).toEqual(400)
                    expect(json).toEqual({
                        errors: [
                            expect.objectContaining({
                                name: 'GQLError',
                                message: 'File not found or you don\'t have access to it',
                            }),
                        ],
                    })
                })

                test('should strict check for required variables at payload', async () => {
                    const user1 = await createTestUser()
                    const user2 = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        authedItemId: user1.user.id,
                        appId, modelNames: ['SomeModel'],
                        ...DV_AND_SENDER,
                    }
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify(meta))

                    const uploadResult = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: user1.getCookie() },
                    })
                    expect(uploadResult.status).toEqual(200)
                    const uploadResultJson = await uploadResult.json()
                    expect(uploadResultJson.data.files).toHaveLength(1)
                    expect(uploadResultJson.data.files[0]).toHaveProperty('id')

                    const result1 = await fetch(serverShareUrl, {
                        method: 'POST',
                        body: JSON.stringify({
                            appId: Object.keys(appClients)[1],
                            authedItemId: user2.user.id,
                            modelNames: ['AnotherModel'],
                            ...DV_AND_SENDER,
                        }),
                        headers: {
                            Cookie: user1.getCookie(),
                            'Content-Type': 'application/json',
                        },
                    })
                    const json1 = await result1.json()
                    expect(result1.status).toEqual(400)
                    expect(json1).toEqual({
                        errors: [
                            expect.objectContaining({
                                name: 'GQLError',
                                message: 'Invalid input: expected string, received undefined - id',
                            }),
                        ],
                    })
                })
            })
        })

        describe('signature', () => {
            test('signed file must be decryptable', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    authedItemId: user.user.id,
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
                    authedItemId: user.user.id,
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
                const file = json.data.files[0]
                expect(file).toHaveProperty('signature')
                expect(file).toHaveProperty('id')
                expect(file).toHaveProperty('fileMeta')
                expect(file.fileMeta).toHaveProperty(['meta', 'fileAdapter'], conf['FILE_FIELD_ADAPTER'])
                expect(file).toHaveProperty('fileKey', file.fileMeta.id)
                expect(file.id).toEqual(file.fileMeta.shareId)
            })

            test('uploading multiple files should be possible', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    authedItemId: user.user.id,
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

            test('file sharing flow', async () => {
                const user1 = await createTestUser()
                const user2 = await createTestUser()

                // First of all we need to upload file as user1
                const form = new FormData()
                const meta = {
                    authedItemId: user1.user.id,
                    appId,
                    modelNames: ['SomeModel'],
                    ...DV_AND_SENDER,
                }
                form.append('meta', JSON.stringify(meta))
                form.append('file', filestream, 'dino.png')

                const uploadResult = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: user1.getCookie() },
                })

                const uploadResultJson = await uploadResult.json()
                expect(uploadResult.status).toEqual(200)
                expect(uploadResultJson.data.files).toHaveLength(1)

                const originalFile = uploadResultJson.data.files[0]

                // Now create another file with same binary from owner user1
                const shareResult = await fetch(serverShareUrl, {
                    method: 'POST',
                    // Only owner user should have access to share it's binary
                    headers: {
                        Cookie: user1.getCookie(),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: originalFile.fileMeta.shareId,
                        // Took another client
                        appId: Object.keys(appClients)[1],
                        // Here we insert the id for which this file is intended
                        authedItemId: user2.user.id,
                        modelNames: ['AnotherModel'],
                        ...DV_AND_SENDER,
                    }),
                })

                expect(shareResult.status).toEqual(200)
                const shareResultJson = await shareResult.json()
                expect(shareResultJson).toHaveProperty(['data', 'file', 'id'])
                const sharedFile = shareResultJson.data.file
                expect(sharedFile).toHaveProperty('signature')
                expect(sharedFile.id).not.toEqual(originalFile.id)
                expect(sharedFile.signature).not.toEqual(originalFile.signature)
                expect(sharedFile.fileMeta).toHaveProperty(['meta', 'authedItemId'], user2.user.id)
                expect(sharedFile.fileMeta).toHaveProperty(['meta', 'appId'], Object.keys(appClients)[1])
                expect(sharedFile.fileMeta).toHaveProperty(['meta', 'sourceAppId'], Object.keys(appClients)[0])
                expect(sharedFile.fileMeta).toHaveProperty(['meta', 'modelNames'], ['AnotherModel'])

                // Final check - verify new application secret can decrypt sign
                const data = jwt.verify(sharedFile.signature, appClients[sharedFile.fileMeta.meta.appId].secret)
                expect(data).not.toBeNull()
            })
        })
    })
}

module.exports = {
    FileMiddlewareTests,
}
