const fs = require('fs')

const { faker } = require('@faker-js/faker')
const FormData = require('form-data')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { makeClient, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const DV_AND_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'test-runner' } }

const FileMiddlewareTests = (testFile) => {
    let serverUrl
    let admin
    let filestream
    beforeAll(async () => {
        const client = await makeClient()
        serverUrl = client.serverUrl + '/api/files/upload'
        admin = await makeLoggedInAdminClient()
        filestream = fs.readFileSync(testFile)
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

                expect(result.status).toEqual(403)
                expect(json).toHaveProperty('error', 'Authorization is required')
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

                expect(result.status).toEqual(405)
                expect(json).toHaveProperty('error', 'Wrong request type. Only "multipart/form-data" is allowed')
            })
            test('upload file without required meta field should be not possible', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Missing multipart field "meta"')
            })

            test('upload file without dv field should fail', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: faker.datatype.uuid() }))
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Missing dv field for meta object')
            })

            test('upload without sender meta field should fail', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: faker.datatype.uuid(), dv: 1 }))
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Missing sender field for meta object')
            })

            test('upload with wrong data version number should fail', async () => {
                let form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: faker.datatype.uuid(), dv: 2, sender: { dv: 1, fingerprint: 'test-runner' } }))
                let result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                let json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Wrong value for data version number')

                form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: faker.datatype.uuid(), dv: 1, sender: { dv: 2, fingerprint: 'test-runner' } }))
                result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Wrong value for data version number')
            })

            test('upload with wrong meta.sender.fingerprint should fail', async () => {
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: faker.datatype.uuid(), dv: 1, sender: { dv: 1, fingerprint: 'test' } }))
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Wrong sender.fingerprint value provided')
            })

            test('upload without file should fail', async () => {
                const form = new FormData()
                form.append('meta', JSON.stringify({ authedItem: faker.datatype.uuid(), appId: 'test-app', ...DV_AND_SENDER }))
                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Missing attached files')
            })

            test('upload with wrong authed item type should fail', async () => {
                const form = new FormData()
                form.append('meta', JSON.stringify({ authedItem: 123, ...DV_AND_SENDER }))
                form.append('file', fs.readFileSync(testFile), 'dino.png')
                const result = await fetch(serverUrl, { method: 'POST', body: form, headers: { Cookie: admin.getCookie() } })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Wrong authedItem value provided')
            })

            test('upload without app id should fail', async () => {
                const form = new FormData()
                form.append('file', fs.readFileSync(testFile), 'dino.png')
                form.append('meta', JSON.stringify({ authedItem: faker.datatype.uuid(), ...DV_AND_SENDER }))
                const result = await fetch(serverUrl, { method: 'POST', body: form, headers: { Cookie: admin.getCookie() } })
                const json = await result.json()

                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Missing appId field for meta object')
            })
        })
        describe('api', () => {
            test('successful upload should return file id', async () => {
                const form = new FormData()
                const meta = {
                    authedItem: faker.datatype.uuid(),
                    appId: 'test-app',
                    ...DV_AND_SENDER,
                }
                form.append('meta', JSON.stringify(meta))
                form.append('file', filestream, 'dino.png')

                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })

                const json = await result.json()

                expect(result.status).toEqual(200)
                expect(json).toHaveLength(1)
                console.log(json[0])
                expect(json[0]).toHaveProperty('id')
            })
            test('uploading multiple files should be possible', async () => {
                const form = new FormData()
                const meta = {
                    authedItem: faker.datatype.uuid(),
                    appId: 'test-app',
                    ...DV_AND_SENDER,
                }
                form.append('meta', JSON.stringify(meta))
                form.append('file', filestream, 'dino.png')
                form.append('file', filestream, 'dino1.png')

                const result = await fetch(serverUrl, {
                    method: 'POST',
                    body: form,
                    headers: { Cookie: admin.getCookie() },
                })
                const json = await result.json()

                expect(result.status).toEqual(200)
                expect(json).toHaveLength(2)
            })
        })
    })
}

module.exports = {
    FileMiddlewareTests,
}
