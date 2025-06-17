const fs = require('fs')

const FormData = require('form-data')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')


const DV_AND_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'test-runner' } }

const FileMiddlewareTests = (testFile) => {
    describe('file middleware', () => {
        describe('validation', () => {
            test('upload file without required meta field should be not possible', async () => {
                const filestream = fs.readFileSync(testFile)
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                const result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })
                const json = await result.json()
                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Missing multipart field "meta"')
            })

            test('upload file without dv field should fail', async () => {
                const filestream = fs.readFileSync(testFile)
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ organization: 123 }))
                const result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })
                const json = await result.json()
                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Missing dv field for meta object')
            })

            test('upload without sender meta field should fail', async () => {
                const filestream = fs.readFileSync(testFile)
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ organization: 123, dv: 1 }))
                const result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })
                const json = await result.json()
                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Missing sender field for meta object')
            })

            test('upload with wrong data version number should fail', async () => {
                const filestream = fs.readFileSync(testFile)
                let form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ organization: 123, dv: 2, sender: { dv: 1, fingerprint: 'test-runner' } }))
                let result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })
                let json = await result.json()
                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Wrong value for data version number')

                form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ organization: 123, dv: 1, sender: { dv: 2, fingerprint: 'test-runner' } }))
                result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })
                json = await result.json()
                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Wrong value for data version number')
            })

            test('upload with wrong meta.sender.fingerprint should fail', async () => {
                const filestream = fs.readFileSync(testFile)
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ organization: 123, dv: 1, sender: { dv: 1, fingerprint: 'test' } }))
                const result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })
                const json = await result.json()
                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Wrong sender.fingerprint value provided')
            })

            test('upload without file should fail', async () => {
                const form = new FormData()
                form.append('meta', JSON.stringify({ organization: 123, user: 321, ...DV_AND_SENDER }))
                const result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })
                const json = await result.json()
                expect(result.status).toEqual(400)
                expect(json).toHaveProperty('error', 'Missing attached files')
            })
        })
        describe('api', () => {
            test('successful upload should return file id', async () => {
                const filestream = fs.readFileSync(testFile)
                const form = new FormData()
                const meta = {
                    user: '123',
                    organization: '321',
                    ...DV_AND_SENDER,
                }
                form.append('meta', JSON.stringify(meta))
                form.append('file', filestream, 'dino.png')

                const result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })

                const json = await result.json()
                expect(result.status).toEqual(200)
                expect(json).toHaveLength(1)
                expect(json[0]).toHaveProperty('id')
                // expect(json[0]).toHaveProperty('filename', json[0].id + '-dino.png')
                // expect(json[0]).toHaveProperty('meta', meta)
            })
            test('uploading multiple files should be possible', async () => {
                const filestream = fs.readFileSync(testFile)
                const form = new FormData()
                const meta = {
                    user: '123',
                    organization: '321',
                    ...DV_AND_SENDER,
                }
                form.append('meta', JSON.stringify(meta))
                form.append('file', filestream, 'dino.png')
                form.append('file', filestream, 'dino1.png')

                const result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
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
