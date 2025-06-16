const fs = require('fs')

const FormData = require('form-data')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')


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

                expect(result.status).toEqual(400)
            })

            test('upload field without required fields should be not possible', async () => {
                const filestream = fs.readFileSync(testFile)
                const form = new FormData()
                form.append('file', filestream, 'dino.png')
                form.append('meta', JSON.stringify({ organization: 123 }))
                const result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })

                expect(result.status).toEqual(400)
            })

            test('upload without file should fail', async () => {
                const form = new FormData()
                form.append('meta', JSON.stringify({ organization: 123, user: 321 }))
                const result = await fetch(conf['SERVER_URL'] + '/api/files/upload', {
                    method: 'POST',
                    body: form,
                })

                expect(result.status).toEqual(400)
            })
        })
    })
}

module.exports = {
    FileMiddlewareTests,
}
