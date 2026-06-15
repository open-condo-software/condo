/**
 * @jest-environment node
 */

const { serveStorageFile } = require('./serveStorageFile')


describe('serveStorageFile', () => {
    const originalFileServeViaNginx = process.env.FILE_SERVE_VIA_NGINX

    afterEach(() => {
        if (originalFileServeViaNginx === undefined) {
            delete process.env.FILE_SERVE_VIA_NGINX
        } else {
            process.env.FILE_SERVE_VIA_NGINX = originalFileServeViaNginx
        }
    })

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

    it('should redirect to storage by default', () => {
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
            signedUrl: 'https://bucket.obs.example.com/folder/file.pdf?sig=1',
        })

        expect(res.headers['X-Accel-Redirect']).toBe('/api/external-files/folder/file.pdf?sig=1')
        expect(res.statusCode).toBe(200)
        expect(res.body).toBeNull()
    })

    it('should treat FILE_SERVE_VIA_NGINX=1 as enabled', () => {
        process.env.FILE_SERVE_VIA_NGINX = '1'
        const res = createMockRes()

        serveStorageFile(res, {
            signedUrl: 'https://storage.example.com/file.pdf',
        })

        expect(res.headers['X-Accel-Redirect']).toBe('/api/external-files/file.pdf')
    })
})
