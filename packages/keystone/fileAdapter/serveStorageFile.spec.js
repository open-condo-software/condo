/**
 * @jest-environment node
 */

const {
    buildXAccelRedirectPath,
    isFileServeViaNginxEnabled,
    serveStorageFile,
} = require('./serveStorageFile')


describe('serveStorageFile', () => {
    const originalFileServeViaNginx = process.env.FILE_SERVE_VIA_NGINX
    const originalFilestorePrefix = process.env.FILE_NGINX_FILESTORE_PREFIX

    afterEach(() => {
        if (originalFileServeViaNginx === undefined) {
            delete process.env.FILE_SERVE_VIA_NGINX
        } else {
            process.env.FILE_SERVE_VIA_NGINX = originalFileServeViaNginx
        }

        if (originalFilestorePrefix === undefined) {
            delete process.env.FILE_NGINX_FILESTORE_PREFIX
        } else {
            process.env.FILE_NGINX_FILESTORE_PREFIX = originalFilestorePrefix
        }

        delete process.env.FILE_NGINX_INTERNAL_STORAGE_PREFIX
    })

    describe('isFileServeViaNginxEnabled', () => {
        it('should return false by default', () => {
            delete process.env.FILE_SERVE_VIA_NGINX
            expect(isFileServeViaNginxEnabled()).toBe(false)
        })

        it('should return true when FILE_SERVE_VIA_NGINX is true or 1', () => {
            process.env.FILE_SERVE_VIA_NGINX = 'true'
            expect(isFileServeViaNginxEnabled()).toBe(true)

            process.env.FILE_SERVE_VIA_NGINX = '1'
            expect(isFileServeViaNginxEnabled()).toBe(true)
        })
    })

    describe('buildXAccelRedirectPath', () => {
        it('should map signed URL path and query to filestore nginx prefix', () => {
            delete process.env.FILE_NGINX_FILESTORE_PREFIX

            const signedUrl = 'https://bucket.obs.example.com/folder/file.pdf?AccessKeyId=abc&Signature=xyz'
            expect(buildXAccelRedirectPath(signedUrl)).toBe(
                '/filestore/folder/file.pdf?AccessKeyId=abc&Signature=xyz'
            )
        })

        it('should use custom filestore prefix from env', () => {
            process.env.FILE_NGINX_FILESTORE_PREFIX = '/custom-filestore'

            const signedUrl = 'https://s3.amazonaws.com/bucket/key?X-Amz-Signature=sig'
            expect(buildXAccelRedirectPath(signedUrl)).toBe(
                '/custom-filestore/bucket/key?X-Amz-Signature=sig'
            )
        })
    })

    describe('serveStorageFile', () => {
        function createMockRes () {
            return {
                headers: {},
                statusCode: null,
                body: null,
                setHeader (name, value) {
                    this.headers[name] = value
                },
                status (code) {
                    this.statusCode = code
                    return this
                },
                end () {
                    this.body = null
                },
                json (data) {
                    this.body = data
                },
                redirect (url) {
                    this.body = { redirect: url }
                },
            }
        }

        it('should redirect by default', () => {
            delete process.env.FILE_SERVE_VIA_NGINX
            const res = createMockRes()

            serveStorageFile(res, {
                signedUrl: 'https://storage.example.com/file.pdf?sig=1',
            })

            expect(res.body).toEqual({ redirect: 'https://storage.example.com/file.pdf?sig=1' })
        })

        it('should return redirectUrl json when shallow-redirect is requested', () => {
            delete process.env.FILE_SERVE_VIA_NGINX
            const res = createMockRes()

            serveStorageFile(res, {
                signedUrl: 'https://storage.example.com/file.pdf?sig=1',
                shallowRedirect: 'true',
            })

            expect(res.body).toEqual({ redirectUrl: 'https://storage.example.com/file.pdf?sig=1' })
        })

        it('should use X-Accel-Redirect when FILE_SERVE_VIA_NGINX is enabled', () => {
            process.env.FILE_SERVE_VIA_NGINX = 'true'
            const res = createMockRes()

            serveStorageFile(res, {
                signedUrl: 'https://storage.example.com/folder/file.pdf?sig=1',
                shallowRedirect: 'true',
            })

            expect(res.headers['X-Accel-Redirect']).toBe('/filestore/folder/file.pdf?sig=1')
            expect(res.statusCode).toBe(200)
            expect(res.body).toBeNull()
        })
    })
})
