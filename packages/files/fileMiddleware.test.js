const fs = require('fs')

const { faker } = require('@faker-js/faker')
const FormData = require('form-data')
const jwt = require('jsonwebtoken')

const conf = require('@open-condo/config')
const { parseAndValidateFileMetaSignature, validateFileUploadSignature } = require('@open-condo/files/utils')
const { HTTPStatusByGQLErrorCode } = require('@open-condo/keystone/errors')
const { fetch } = require('@open-condo/keystone/fetch')
const { getKVClient } = require('@open-condo/keystone/kv')
const { makeClient, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const DV_AND_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'test-runner' } }

async function expectGQLErrorResponse (response, errorFields) {
    const status = HTTPStatusByGQLErrorCode[errorFields.code] || 500
    expect(response.status).toEqual(status)
    const body = await response.json()
    expect(body).toEqual({
        errors: [
            expect.objectContaining({
                name: 'GQLError',
                message: expect.stringContaining(''),
                reqId: expect.stringContaining(''),
                errId: expect.stringContaining(''),
                extensions: expect.objectContaining(errorFields),
            }),
        ],
    })
}

const FileMiddlewareTests = (testFile, UserSchema, createTestUser, createOrganization) => {
    const appClients = JSON.parse(conf['FILE_UPLOAD_CONFIG']).clients
    const fileClientId = Object.keys(appClients)[0]
    let serverUrl
    let serverShareUrl
    let serverAttachUrl
    let admin
    let organization
    let filestream
    beforeAll(async () => {
        // Clean rate limits
        const kv = getKVClient('guards')

        const client = await makeClient()
        serverUrl = client.serverUrl + '/api/files/upload'
        serverShareUrl = client.serverUrl + '/api/files/share'
        serverAttachUrl = client.serverUrl + '/api/files/attach'
        admin = await makeLoggedInAdminClient()
        filestream = fs.readFileSync(testFile)
        organization = await createOrganization(admin)

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

                await expectGQLErrorResponse(result, {
                    code: 'UNAUTHENTICATED',
                    type: 'AUTHORIZATION_REQUIRED',
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

                await expectGQLErrorResponse(result, {
                    code: 'UNAUTHENTICATED',
                    type: 'AUTHORIZATION_REQUIRED',
                })
            })

            test('User should not be able to upload file for another user', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({
                    user: { id: faker.datatype.uuid() },
                    fileClientId,
                    modelNames: ['SomeModel'],
                    ...DV_AND_SENDER,
                }))

                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })

                await expectGQLErrorResponse(result, {
                    code: 'BAD_USER_INPUT',
                    type: 'INVALID_META',
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

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'WRONG_REQUEST_METHOD_TYPE',
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

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'MISSING_META',
                    })
                })

                test('upload file without dv field should fail', async () => {
                    const form = new FormData()
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify({ user: { id: admin.user.id } }))
                    const result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: admin.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    })
                })

                test('upload without sender meta field should fail', async () => {
                    const form = new FormData()
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify({ user: { id: admin.user.id }, dv: 1 }))
                    const result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: admin.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    })
                })

                test('upload with wrong data version number should fail', async () => {
                    let form = new FormData()
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify({ user: { id: admin.user.id }, dv: 2, sender: { dv: 1, fingerprint: 'test-runner' } }))
                    let result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: admin.getCookie() },
                    })
                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    })

                    form = new FormData()
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify({ user: { id: admin.user.id }, dv: 1, sender: { dv: 2, fingerprint: 'test-runner' } }))
                    result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: admin.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    })
                })

                test('upload with wrong meta.sender.fingerprint should fail', async () => {
                    const form = new FormData()
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify({ user: { id: admin.user.id }, dv: 1, sender: { dv: 1, fingerprint: 'test' } }))
                    const result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: admin.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    })
                })

                test('upload without file should fail', async () => {
                    const form = new FormData()
                    form.append('meta', JSON.stringify({ user: { id: admin.user.id }, fileClientId, modelNames: ['SomeModel'], ...DV_AND_SENDER }))
                    const result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: admin.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'MISSING_ATTACHED_FILES',
                    })
                })

                test('upload with wrong authed item type should fail', async () => {
                    const form = new FormData()
                    form.append('meta', JSON.stringify({ user: 123, ...DV_AND_SENDER }))
                    form.append('file', fs.readFileSync(testFile), 'dino.png')
                    const result = await fetch(serverUrl, {
                        method: 'POST', body: form, headers: { Cookie: admin.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    })
                })

                test('upload without app id should fail', async () => {
                    const form = new FormData()
                    form.append('file', fs.readFileSync(testFile), 'dino.png')
                    form.append('meta', JSON.stringify({ user: { id: admin.user.id }, ...DV_AND_SENDER }))
                    const result = await fetch(serverUrl, {
                        method: 'POST', body: form, headers: { Cookie: admin.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    })
                })

                test('upload with wrong fileClientId should fail', async () => {
                    const fileClientId = faker.datatype.uuid()
                    const form = new FormData()
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify({ user: { id: admin.user.id }, fileClientId, modelNames: ['SomeModel'], ...DV_AND_SENDER }))
                    const result = await fetch(serverUrl, {
                        method: 'POST', body: form, headers: { Cookie: admin.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'FORBIDDEN',
                        type: 'INVALID_APP_ID',
                    })
                })

                test('upload with malformed attach should fail (non-JSON string)', async () => {
                    const user = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        user: { id: user.user.id },
                        fileClientId,
                        modelNames: ['SomeModel'],
                        ...DV_AND_SENDER,
                    }
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify(meta))
                    form.append('attach', 'not a json') // malformed

                    const result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: user.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_PAYLOAD',
                    })
                })

                test('upload with invalid attach payload shape should fail', async () => {
                    const user = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        user: { id: user.user.id },
                        fileClientId,
                        modelNames: ['SomeModel'],
                        ...DV_AND_SENDER,
                    }
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify(meta))
                    // missing itemId; wrong dv on sender
                    form.append('attach', JSON.stringify({
                        modelName: 'SomeModel',
                        dv: 1,
                        sender: { dv: 2, fingerprint: 'test-runner' },
                    }))

                    const result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: user.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_PAYLOAD',
                    })
                })

                test('upload with attach where modelName is not allowed should fail', async () => {
                    const user = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        user: { id: user.user.id },
                        fileClientId,
                        modelNames: ['SomeModel'], // "AnotherModel" is NOT allowed
                        ...DV_AND_SENDER,
                    }
                    form.append('file', filestream, 'dino.png')
                    form.append('meta', JSON.stringify(meta))
                    form.append('attach', JSON.stringify({
                        itemId: faker.datatype.uuid(),
                        modelName: 'AnotherModel',
                        ...DV_AND_SENDER,
                    }))

                    const result = await fetch(serverUrl, {
                        method: 'POST',
                        body: form,
                        headers: { Cookie: user.getCookie() },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_PAYLOAD',
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

                    await expectGQLErrorResponse(result, {
                        code: 'UNAUTHENTICATED',
                        type: 'AUTHORIZATION_REQUIRED',
                    })
                })

                test('only owner of the binary can share', async () => {
                    const user1 = await createTestUser()
                    const user2 = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        user: { id: user1.user.id },
                        fileClientId, modelNames: ['SomeModel'],
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
                    expect(uploadResultJson.data.files[0]).toHaveProperty('signature')

                    const result = await fetch(serverShareUrl, {
                        method: 'POST',
                        body: JSON.stringify({
                            id: uploadResultJson.data.files[0].id,
                            fileClientId: Object.keys(appClients)[1],
                            user: { id: user2.user.id },
                            modelNames: ['AnotherModel'],
                            ...DV_AND_SENDER,
                        }),
                        // Here should be user1 - file owner
                        headers: { Cookie: user2.getCookie(), 'Content-Type': 'application/json' },
                    })

                    await expectGQLErrorResponse(result, {
                        code: 'BAD_USER_INPUT',
                        type: 'FILE_NOT_FOUND',
                    })
                })

                test('should strict check for required variables at payload', async () => {
                    const user1 = await createTestUser()
                    const user2 = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        user: { id: user1.user.id },
                        fileClientId, modelNames: ['SomeModel'],
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
                    expect(uploadResultJson.data.files[0]).toHaveProperty('signature')

                    const result1 = await fetch(serverShareUrl, {
                        method: 'POST',
                        body: JSON.stringify({
                            fileClientId: Object.keys(appClients)[1],
                            user: { id: user2.user.id },
                            modelNames: ['AnotherModel'],
                            ...DV_AND_SENDER,
                        }),
                        headers: {
                            Cookie: user1.getCookie(),
                            'Content-Type': 'application/json',
                        },
                    })

                    await expectGQLErrorResponse(result1, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_PAYLOAD',
                    })
                })
            })

            describe('attach', () => {
                test('only authorized user can attach file', async () => {
                    const user = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        user: { id: user.user.id },
                        fileClientId,
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
                    expect(file).toEqual({
                        id: file.id,
                        signature: file.signature,
                        originalFilename: 'dino.png',
                    })

                    const attachResult = await fetch(serverAttachUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            signature: file.signature,
                            itemId: faker.datatype.uuid(),
                            modelName: 'SomeModel',
                            fileClientId,
                            dv: 1, sender: { dv: 1, fingerprint: 'test-runner' },
                        }),
                    })

                    await expectGQLErrorResponse(attachResult, {
                        code: 'UNAUTHENTICATED',
                        type: 'AUTHORIZATION_REQUIRED',
                    })
                })

                test('only owner of the file can attach it to the model', async () => {
                    const user = await createTestUser()
                    const anotherUser = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        user: { id: user.user.id },
                        fileClientId,
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
                    expect(file).toEqual({
                        id: file.id,
                        signature: file.signature,
                        originalFilename: 'dino.png',
                    })

                    const attachResult = await fetch(serverAttachUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Cookie: anotherUser.getCookie(),
                        },
                        body: JSON.stringify({
                            signature: file.signature,
                            itemId: faker.datatype.uuid(),
                            modelName: 'SomeModel',
                            fileClientId,
                            dv: 1, sender: { dv: 1, fingerprint: 'test-runner' },
                        }),
                    })

                    await expectGQLErrorResponse(attachResult, {
                        code: 'BAD_USER_INPUT',
                        type: 'FILE_NOT_FOUND',
                    })
                })

                test('only allowed models should be connected', async () => {
                    const user = await createTestUser()
                    const form = new FormData()
                    const meta = {
                        user: { id: user.user.id },
                        fileClientId,
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
                    expect(file).toEqual({
                        id: file.id,
                        signature: file.signature,
                        originalFilename: 'dino.png',
                    })

                    const attachResult = await fetch(serverAttachUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Cookie: user.getCookie(),
                        },
                        body: JSON.stringify({
                            signature: file.signature,
                            itemId: faker.datatype.uuid(),
                            modelName: 'AnotherModel',
                            fileClientId,
                            dv: 1, sender: { dv: 1, fingerprint: 'test-runner' },
                        }),
                    })

                    await expectGQLErrorResponse(attachResult, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_PAYLOAD',
                    })
                })

                test('random or broken signature should be handled', async () => {
                    const user = await createTestUser()
                    const attachResult = await fetch(serverAttachUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Cookie: user.getCookie(),
                        },
                        body: JSON.stringify({
                            signature: faker.datatype.uuid(),
                            itemId: faker.datatype.uuid(),
                            modelName: 'AnotherModel',
                            fileClientId,
                            dv: 1, sender: { dv: 1, fingerprint: 'test-runner' },
                        }),
                    })

                    await expectGQLErrorResponse(attachResult, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_PAYLOAD',
                    })
                })

                test('requires specifying an identifier where the file will be attached', async () => {
                    const user = await createTestUser()
                    const attachResult = await fetch(serverAttachUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Cookie: user.getCookie(),
                        },
                        body: JSON.stringify({
                            signature: faker.datatype.uuid(),
                            modelName: 'AnotherModel',
                            fileClientId,
                            dv: 1, sender: { dv: 1, fingerprint: 'test-runner' },
                        }),
                    })

                    await expectGQLErrorResponse(attachResult, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_PAYLOAD',
                    })
                })
            })
        })

        describe('signature', () => {
            test('signed file must be decryptable', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    user: { id: user.user.id },
                    fileClientId,
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
                expect(json.data.files[0]).toHaveProperty('signature')

                const secret = JSON.parse(conf['FILE_UPLOAD_CONFIG']).clients[meta.fileClientId]['secret']
                const data = jwt.verify(json.data.files[0].signature, secret, { algorithms: ['HS256'] })
                expect(data).not.toBeNull()
            })
        })

        describe('api', () => {
            test('successful upload should return file id', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    user: { id: user.user.id },
                    organization: { id: organization[0].id },
                    fileClientId,
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
                expect(file).toEqual({
                    id: file.id,
                    signature: file.signature,
                    originalFilename: 'dino.png',
                })
            })

            test('signature should contain correct payload', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    user: { id: user.user.id },
                    fileClientId,
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
                expect(file).toEqual({
                    id: file.id,
                    signature: file.signature,
                    originalFilename: 'dino.png',
                })

                const decryptedData = jwt.verify(file.signature, appClients[Object.keys(appClients)[0]].secret, { algorithms: ['HS256'] })

                const { success } = validateFileUploadSignature(decryptedData)
                // Check encrypted shape has an expected shape
                expect(success).toBeTruthy()
            })

            test('uploading multiple files should be possible', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    user: { id: user.user.id },
                    fileClientId,
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
                    user: { id: user1.user.id },
                    fileClientId,
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
                        id: originalFile.id,
                        // Took another client
                        fileClientId: Object.keys(appClients)[1],
                        // Here we insert the id for which this file is intended
                        user: { id: user2.user.id },
                        modelNames: ['AnotherModel'],
                        ...DV_AND_SENDER,
                    }),
                })

                expect(shareResult.status).toEqual(200)
                const shareResultJson = await shareResult.json()

                expect(shareResultJson).toEqual({
                    data: {
                        file: {
                            id: shareResultJson.data.file.id,
                            signature: shareResultJson.data.file.signature,
                        },
                    },
                })
                const sharedFile = shareResultJson.data.file
                const decryptedData = jwt.verify(sharedFile.signature, appClients[Object.keys(appClients)[1]].secret, { algorithms: ['HS256'] })

                expect(decryptedData).toEqual(expect.objectContaining({
                    id: decryptedData.id,
                    exp: decryptedData.exp,
                    iat: decryptedData.iat,
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'test-runner' },
                    fileClientId: Object.keys(appClients)[1],
                    modelNames: ['AnotherModel'],
                    sourceFileClientId: Object.keys(appClients)[0],
                    user: { id: user2.user.id },
                }))
            })

            test('file attach flow', async () => {
                const user = await createTestUser()
                const form = new FormData()
                const meta = {
                    user: { id: user.user.id },
                    fileClientId,
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
                expect(file).toEqual({
                    id: file.id,
                    signature: file.signature,
                    originalFilename: 'dino.png',
                })

                const attachResult = await fetch(serverAttachUrl, {
                    method: 'POST',
                    headers: {
                        Cookie: user.getCookie(),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        signature: file.signature,
                        itemId: faker.datatype.uuid(),
                        modelName: 'SomeModel',
                        fileClientId,
                        dv: 1, sender: { dv: 1, fingerprint: 'test-runner' },
                    }),
                })

                const attachJson = await attachResult.json()
                expect(attachResult.status).toEqual(200)
                expect(attachJson.data.file).toHaveProperty('signature')

                // Check attach signed payload
                const attachPayload = jwt.verify(
                    attachJson.data.file.signature,
                    appClients[Object.keys(appClients)[0]].secret,
                    { algorithms: ['HS256'] }
                )

                const { success } = parseAndValidateFileMetaSignature(attachPayload)
                expect(success).toBeTruthy()
            })

            test('upload with inline attach should immediately attach and return publicSignature', async () => {
                const user = await createTestUser()
                const modelName = 'SomeModel'
                const itemId = faker.datatype.uuid()
                const form = new FormData()
                const meta = {
                    user: { id: user.user.id },
                    fileClientId,
                    modelNames: [modelName],
                    ...DV_AND_SENDER,
                }
                form.append('meta', JSON.stringify(meta))
                form.append('attach', JSON.stringify({
                    itemId,
                    modelName,
                    ...DV_AND_SENDER,
                }))
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
                // legacy fields preserved
                expect(file).toEqual(expect.objectContaining({
                    id: file.id,
                    signature: file.signature,
                }))
                // new fields for inline attach
                expect(file).toEqual(expect.objectContaining({
                    attached: true,
                    publicSignature: expect.any(String),
                }))

                // Validate that publicSignature contains file meta (same as /attach returns)
                const secret = appClients[fileClientId].secret
                const publicPayload = jwt.verify(file.publicSignature, secret, { algorithms: ['HS256'] })
                const { success } = parseAndValidateFileMetaSignature(publicPayload)
                expect(success).toBeTruthy()
            })

            test('upload with inline attach for multiple files should attach all and return publicSignature per file', async () => {
                const user = await createTestUser()
                const modelName = 'SomeModel'
                const itemId = faker.datatype.uuid()
                const form = new FormData()
                const meta = {
                    user: { id: user.user.id },
                    fileClientId,
                    modelNames: [modelName],
                    ...DV_AND_SENDER,
                }
                form.append('meta', JSON.stringify(meta))
                form.append('attach', JSON.stringify({
                    itemId,
                    modelName,
                    ...DV_AND_SENDER,
                }))
                form.append('file', filestream, 'dino.png')
                form.append('file', filestream, 'dino2.png')

                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: user.getCookie() },
                })

                const json = await result.json()
                expect(result.status).toEqual(200)
                expect(json.data.files).toHaveLength(2)

                const secret = appClients[fileClientId].secret
                for (const f of json.data.files) {
                    expect(f).toEqual(expect.objectContaining({
                        id: f.id,
                        signature: f.signature,
                        attached: true,
                        publicSignature: expect.any(String),
                    }))
                    const payload = jwt.verify(f.publicSignature, secret, { algorithms: ['HS256'] })
                    const { success } = parseAndValidateFileMetaSignature(payload)
                    expect(success).toBeTruthy()
                }
            })

        })
    })
}

module.exports = {
    FileMiddlewareTests,
}
