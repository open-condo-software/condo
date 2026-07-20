jest.mock('@open-condo/keystone/fetch', () => ({ fetch: jest.fn() }))

const { EventEmitter } = require('events')
const https = require('https')
const { Readable } = require('stream')

const { fetch } = require('@open-condo/keystone/fetch')

const {
    EmailAdapter,
    EMAIL_ADAPTER_TYPE_MAILGUN,
    EMAIL_ADAPTER_TYPE_SENDSAY,
    EMAIL_ADAPTER_TYPE_UNISENDER_GO,
} = require('./emailAdapter')

const MAILGUN_CONFIG = {
    api_url: 'https://api.mailgun.net/v3/example.com/messages',
    token: 'test-mailgun-token',
    from: 'Condo <noreply@example.com>',
    useTags: true,
    useAttachingData: true,
}

const UNISENDER_GO_CONFIG = {
    type: EMAIL_ADAPTER_TYPE_UNISENDER_GO,
    api_url: 'https://go1.unisender.ru/ru/transactional/api/v1',
    token: 'test-unisender-api-key',
    from: 'Condo <noreply@example.com>',
    useTags: true,
    useAttachingData: true,
}

const SENDSAY_CONFIG = {
    type: EMAIL_ADAPTER_TYPE_SENDSAY,
    api_url: 'https://api.sendsay.ru/general/api/v100/json',
    login: 'shared-login',
    sublogin: 'project-sublogin',
    passwd: 'super-secret',
    from: 'Condo <noreply@example.com>',
    useTags: true,
    useAttachingData: true,
}

const ENV_KEYS = ['EMAIL_API_CONFIG']
const ATTACHMENT_URL = 'https://files.example.com/doc.txt'
const ATTACHMENT_CONTENT = 'attachment-body'

const createJsonResponse = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
})

const mockHttpsGetWithStream = ({ content = ATTACHMENT_CONTENT, statusCode = 200, error } = {}) => {
    return jest.spyOn(https, 'get').mockImplementation((url, callback) => {
        const request = new EventEmitter()
        request.destroy = jest.fn((err) => {
            if (err) {
                process.nextTick(() => request.emit('error', err))
            }
        })

        process.nextTick(() => {
            if (error) {
                request.emit('error', error)
                return
            }
            const stream = Readable.from([Buffer.from(content)])
            stream.statusCode = statusCode
            callback(stream)
        })

        return request
    })
}

const mockHttpsGetOversizedStream = () => {
    return jest.spyOn(https, 'get').mockImplementation((url, callback) => {
        const request = new EventEmitter()
        request.destroy = jest.fn()

        process.nextTick(() => {
            const chunk = Buffer.alloc(1024 * 1024)
            async function * oversized () {
                for (let i = 0; i < 11; i++) {
                    yield chunk
                }
            }
            const stream = Readable.from(oversized())
            stream.statusCode = 200
            callback(stream)
        })

        return request
    })
}

describe('Email adapters', () => {
    const originalEnv = {}

    beforeAll(() => {
        ENV_KEYS.forEach((key) => {
            originalEnv[key] = process.env[key]
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
        ENV_KEYS.forEach((key) => {
            if (originalEnv[key] === undefined) {
                delete process.env[key]
            } else {
                process.env[key] = originalEnv[key]
            }
        })
    })

    describe('Mailgun adapter', () => {
        beforeEach(() => {
            process.env.EMAIL_API_CONFIG = JSON.stringify(MAILGUN_CONFIG)
        })

        it('marks adapter as configured when EMAIL_API_CONFIG is valid', () => {
            const adapter = new EmailAdapter()
            expect(adapter.isConfigured).toBe(true)
            expect(adapter.provider).toBe(EMAIL_ADAPTER_TYPE_MAILGUN)
        })

        it('treats type=mailgun the same as omitted type', () => {
            const adapter = new EmailAdapter({
                ...MAILGUN_CONFIG,
                type: EMAIL_ADAPTER_TYPE_MAILGUN,
            })
            expect(adapter.isConfigured).toBe(true)
            expect(adapter.provider).toBe(EMAIL_ADAPTER_TYPE_MAILGUN)
        })

        it('marks adapter as not configured when EMAIL_API_CONFIG is missing required fields', () => {
            process.env.EMAIL_API_CONFIG = JSON.stringify({ api_url: 'https://example.com' })
            const adapter = new EmailAdapter()
            expect(adapter.isConfigured).toBe(false)
        })

        it('supports valid emails and rejects values without @', () => {
            const adapter = new EmailAdapter()
            expect(adapter.isEmailSupported('user@example.com')).toBe(true)
            expect(adapter.isEmailSupported('Bob <bob@host.com>')).toBe(true)
            expect(adapter.isEmailSupported('not-an-email')).toBe(false)
        })

        it('throws when required send arguments are missing', async () => {
            const adapter = new EmailAdapter()

            await expect(adapter.send({ to: 'user@example.com', subject: 'Hi' }))
                .rejects.toThrow('no text or html argument')
            await expect(adapter.send({ to: 'user@example.com', text: 'Hi' }))
                .rejects.toThrow('no subject argument')
            await expect(adapter.send({ subject: 'Hi', text: 'body' }))
                .rejects.toThrow('unsupported to argument format')
        })

        it('sends message via Mailgun form API and returns success metadata', async () => {
            fetch.mockResolvedValue(createJsonResponse(200, { id: '<mailgun-id>', message: 'Queued. Thank you.' }))

            const adapter = new EmailAdapter()
            const [isOk, context] = await adapter.send({
                to: 'user@example.com',
                emailFrom: 'support@example.com',
                subject: 'Hello',
                text: 'Plain text',
                html: '<p>HTML</p>',
                messageType: 'INVITE_NEW_EMPLOYEE',
                meta: { attachingData: { ticketId: '42' } },
            })

            expect(isOk).toBe(true)
            expect(context).toEqual({ id: '<mailgun-id>', message: 'Queued. Thank you.' })
            expect(fetch).toHaveBeenCalledTimes(1)

            const [calledUrl, calledOpts] = fetch.mock.calls[0]
            expect(calledUrl).toBe(MAILGUN_CONFIG.api_url)
            expect(calledOpts.method).toBe('POST')
            expect(calledOpts.headers.Authorization).toMatch(/^Basic /)
            expect(calledOpts.body).toBeDefined()
        })

        it('returns false with status payload when Mailgun responds with non-200', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 401,
                json: jest.fn(),
                text: jest.fn().mockResolvedValue('Forbidden'),
            })

            const adapter = new EmailAdapter()
            const [isOk, context] = await adapter.send({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'Plain text',
            })

            expect(isOk).toBe(false)
            expect(context).toEqual({ text: 'Forbidden', status: 401 })
        })

        it('checkIsAvailable returns false on auth errors', async () => {
            fetch.mockResolvedValue({ ok: false, status: 401 })

            const adapter = new EmailAdapter()
            await expect(adapter.checkIsAvailable()).resolves.toBe(false)
        })

        it('checkIsAvailable returns true when endpoint responds with 405', async () => {
            fetch.mockResolvedValue({ ok: false, status: 405 })

            const adapter = new EmailAdapter()
            await expect(adapter.checkIsAvailable()).resolves.toBe(true)
        })

        it('checkIsAvailable returns false for unexpected statuses', async () => {
            fetch.mockResolvedValue({ ok: false, status: 404 })

            const adapter = new EmailAdapter()
            await expect(adapter.checkIsAvailable()).resolves.toBe(false)
        })

        it('treats HTTP 200 as sent even when Mailgun body is not JSON', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: jest.fn().mockResolvedValue('Queued. Thank you.'),
            })

            const adapter = new EmailAdapter()
            const [isOk, context] = await adapter.send({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'Plain text',
            })

            expect(isOk).toBe(true)
            expect(context).toEqual({ text: 'Queued. Thank you.' })
        })

        it('downloads meta.attachments and includes them in the Mailgun request', async () => {
            mockHttpsGetWithStream({ content: ATTACHMENT_CONTENT })
            fetch.mockResolvedValue(createJsonResponse(200, { id: '<mailgun-id>', message: 'Queued. Thank you.' }))

            const adapter = new EmailAdapter()
            const [isOk] = await adapter.send({
                to: 'user@example.com',
                subject: 'With attachment',
                text: 'See file',
                meta: {
                    attachments: [{
                        publicUrl: ATTACHMENT_URL,
                        mimetype: 'text/plain',
                        originalFilename: 'doc.txt',
                    }],
                },
            })

            expect(isOk).toBe(true)
            expect(https.get).toHaveBeenCalledWith(ATTACHMENT_URL, expect.any(Function))
            expect(fetch).toHaveBeenCalledTimes(1)
            expect(fetch.mock.calls[0][1].body).toBeDefined()
        })

        it('fails send when attachment download returns status >= 400', async () => {
            mockHttpsGetWithStream({ statusCode: 404 })

            const adapter = new EmailAdapter()
            await expect(adapter.send({
                to: 'user@example.com',
                subject: 'With attachment',
                text: 'See file',
                meta: {
                    attachments: [{
                        publicUrl: ATTACHMENT_URL,
                        mimetype: 'text/plain',
                        originalFilename: 'doc.txt',
                    }],
                },
            })).rejects.toThrow('Failed to download attachment: 404')
        })

        it('fails send when attachment download request errors', async () => {
            mockHttpsGetWithStream({ error: new Error('socket hang up') })

            const adapter = new EmailAdapter()
            await expect(adapter.send({
                to: 'user@example.com',
                subject: 'With attachment',
                text: 'See file',
                meta: {
                    attachments: [{
                        publicUrl: ATTACHMENT_URL,
                        mimetype: 'text/plain',
                        originalFilename: 'doc.txt',
                    }],
                },
            })).rejects.toThrow('socket hang up')
        })

        it('fails send when attachment exceeds maximum size', async () => {
            mockHttpsGetOversizedStream()

            const adapter = new EmailAdapter()
            await expect(adapter.send({
                to: 'user@example.com',
                subject: 'With attachment',
                text: 'See file',
                meta: {
                    attachments: [{
                        publicUrl: ATTACHMENT_URL,
                        mimetype: 'application/octet-stream',
                        originalFilename: 'big.bin',
                    }],
                },
            })).rejects.toThrow('Attachment exceeds maximum size')
        })

        it('applies maxAttachmentSizeBytes from EMAIL_API_CONFIG', async () => {
            process.env.EMAIL_API_CONFIG = JSON.stringify({
                ...MAILGUN_CONFIG,
                maxAttachmentSizeBytes: 4,
            })
            mockHttpsGetWithStream({ content: 'too-big' })

            const adapter = new EmailAdapter()
            await expect(adapter.send({
                to: 'user@example.com',
                subject: 'With attachment',
                text: 'See file',
                meta: {
                    attachments: [{
                        publicUrl: ATTACHMENT_URL,
                        mimetype: 'text/plain',
                        originalFilename: 'doc.txt',
                    }],
                },
            })).rejects.toThrow('Attachment exceeds maximum size of 4 bytes')
        })
    })

    describe('Unisender Go adapter', () => {
        beforeEach(() => {
            process.env.EMAIL_API_CONFIG = JSON.stringify(UNISENDER_GO_CONFIG)
        })

        it('marks adapter as configured when EMAIL_API_CONFIG type is unisendergo', () => {
            const adapter = new EmailAdapter()
            expect(adapter.isConfigured).toBe(true)
            expect(adapter.provider).toBe(EMAIL_ADAPTER_TYPE_UNISENDER_GO)
        })

        it('marks adapter as not configured when EMAIL_API_CONFIG is incomplete', () => {
            process.env.EMAIL_API_CONFIG = JSON.stringify({
                type: EMAIL_ADAPTER_TYPE_UNISENDER_GO,
                api_url: 'https://go1.unisender.ru/ru/transactional/api/v1',
            })
            const adapter = new EmailAdapter()
            expect(adapter.isConfigured).toBe(false)
        })

        it('sends JSON payload to email/send.json with required fields', async () => {
            fetch.mockResolvedValue(createJsonResponse(200, {
                status: 'success',
                job_id: '1ZymBc-00041N-9X',
                emails: ['user@example.com'],
            }))

            const adapter = new EmailAdapter()
            const [isOk, context] = await adapter.send({
                to: 'user@example.com',
                emailFrom: 'Support <support@example.com>',
                subject: 'Hello from Unisender',
                text: 'Plain text',
                html: '<b>HTML</b>',
                messageType: 'SHARE_TICKET',
                meta: { attachingData: { organizationId: 'org-1' } },
            })

            expect(isOk).toBe(true)
            expect(context.status).toBe('success')
            expect(context.job_id).toBe('1ZymBc-00041N-9X')
            expect(fetch).toHaveBeenCalledTimes(1)

            const [calledUrl, calledOpts] = fetch.mock.calls[0]
            expect(calledUrl).toBe(`${UNISENDER_GO_CONFIG.api_url}/email/send.json`)
            expect(calledOpts.method).toBe('POST')
            expect(calledOpts.headers).toEqual({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-KEY': UNISENDER_GO_CONFIG.token,
            })

            const body = JSON.parse(calledOpts.body)
            expect(body.message).toMatchObject({
                recipients: [{ email: 'user@example.com' }],
                from_email: 'noreply@example.com',
                from_name: 'Condo',
                subject: 'Hello from Unisender',
                reply_to: 'support@example.com',
                reply_to_name: 'Support',
                tags: ['SHARE_TICKET'],
                body: {
                    html: '<b>HTML</b>',
                    plaintext: 'Plain text',
                },
                global_metadata: {
                    attachingData: JSON.stringify({ organizationId: 'org-1' }),
                },
            })
            expect(body.message.headers).toBeUndefined()
        })

        it('parses named and comma-separated recipients and sets To/CC headers', async () => {
            fetch.mockResolvedValue(createJsonResponse(200, {
                status: 'success',
                job_id: 'job-2',
                emails: ['bob@host.com', 'cc@host.com'],
            }))

            const adapter = new EmailAdapter()
            const [isOk] = await adapter.send({
                to: 'Bob <bob@host.com>',
                cc: 'Copy <cc@host.com>',
                bcc: 'bcc@host.com',
                subject: 'With copies',
                html: '<p>Hi</p>',
            })

            expect(isOk).toBe(true)
            const body = JSON.parse(fetch.mock.calls[0][1].body)
            expect(body.message.recipients).toEqual([
                { email: 'bob@host.com' },
                { email: 'cc@host.com' },
                { email: 'bcc@host.com' },
            ])
            expect(body.message.headers).toEqual({
                To: 'Bob <bob@host.com>',
                CC: 'Copy <cc@host.com>',
            })
        })

        it('normalizes trailing slash in api_url', async () => {
            process.env.EMAIL_API_CONFIG = JSON.stringify({
                ...UNISENDER_GO_CONFIG,
                api_url: `${UNISENDER_GO_CONFIG.api_url}/`,
            })
            fetch.mockResolvedValue(createJsonResponse(200, { status: 'success', job_id: 'job-3', emails: ['user@example.com'] }))

            const adapter = new EmailAdapter()
            await adapter.send({
                to: 'user@example.com',
                subject: 'Slash',
                text: 'ok',
            })

            expect(fetch.mock.calls[0][0]).toBe(`${UNISENDER_GO_CONFIG.api_url}/email/send.json`)
        })

        it('returns false when Unisender Go responds with error status', async () => {
            fetch.mockResolvedValue(createJsonResponse(400, {
                status: 'error',
                code: 101,
                message: 'Invalid API key',
            }))

            const adapter = new EmailAdapter()
            const [isOk, context] = await adapter.send({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'Plain text',
            })

            expect(isOk).toBe(false)
            expect(context.status).toBe('error')
            expect(context.code).toBe(101)
        })

        it('returns false with raw text when response is not JSON', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 502,
                json: jest.fn(),
                text: jest.fn().mockResolvedValue('Bad Gateway'),
            })

            const adapter = new EmailAdapter()
            const [isOk, context] = await adapter.send({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'Plain text',
            })

            expect(isOk).toBe(false)
            expect(context).toEqual({ text: 'Bad Gateway', status: 502 })
        })

        it('merges extendedParams into Unisender message payload', async () => {
            fetch.mockResolvedValue(createJsonResponse(200, { status: 'success', job_id: 'job-4', emails: ['user@example.com'] }))

            const adapter = new EmailAdapter()
            await adapter.send({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'Plain text',
            }, {
                skip_unsubscribe: 1,
                track_links: 0,
            })

            const body = JSON.parse(fetch.mock.calls[0][1].body)
            expect(body.message.skip_unsubscribe).toBe(1)
            expect(body.message.track_links).toBe(0)
        })

        it('checkIsAvailable uses email-validation endpoint', async () => {
            fetch.mockResolvedValue(createJsonResponse(200, { status: 'success', result: 'valid' }))

            const adapter = new EmailAdapter()
            await expect(adapter.checkIsAvailable()).resolves.toBe(true)

            expect(fetch).toHaveBeenCalledWith(
                `${UNISENDER_GO_CONFIG.api_url}/email-validation/single.json`,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'X-API-KEY': UNISENDER_GO_CONFIG.token,
                    }),
                }),
            )
            expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: 'noreply@example.com' })
        })

        it('checkIsAvailable returns false when validation API fails', async () => {
            fetch.mockResolvedValue(createJsonResponse(401, { status: 'error', message: 'Unauthorized' }))

            const adapter = new EmailAdapter()
            await expect(adapter.checkIsAvailable()).resolves.toBe(false)
        })

        it('downloads meta.attachments and sends them as base64 content', async () => {
            mockHttpsGetWithStream({ content: ATTACHMENT_CONTENT })
            fetch.mockResolvedValue(createJsonResponse(200, {
                status: 'success',
                job_id: 'job-attach',
                emails: ['user@example.com'],
            }))

            const adapter = new EmailAdapter()
            const [isOk] = await adapter.send({
                to: 'user@example.com',
                subject: 'With attachment',
                text: 'See file',
                meta: {
                    attachments: [{
                        publicUrl: ATTACHMENT_URL,
                        mimetype: 'text/plain',
                        originalFilename: 'doc.txt',
                    }],
                },
            })

            expect(isOk).toBe(true)
            expect(https.get).toHaveBeenCalledWith(ATTACHMENT_URL, expect.any(Function))
            const body = JSON.parse(fetch.mock.calls[0][1].body)
            expect(body.message.attachments).toEqual([{
                type: 'text/plain',
                name: 'doc.txt',
                content: Buffer.from(ATTACHMENT_CONTENT).toString('base64'),
            }])
        })

        it('accepts in-memory buffer attachments without downloading', async () => {
            fetch.mockResolvedValue(createJsonResponse(200, {
                status: 'success',
                job_id: 'job-buffer',
                emails: ['user@example.com'],
            }))

            const adapter = new EmailAdapter()
            const [isOk] = await adapter.send({
                to: 'user@example.com',
                subject: 'With buffer',
                text: 'See file',
                meta: {
                    attachments: [{
                        buffer: Buffer.from('csv-rows'),
                        mimetype: 'text/csv',
                        originalFilename: 'export.csv',
                    }],
                },
            })

            expect(isOk).toBe(true)
            const body = JSON.parse(fetch.mock.calls[0][1].body)
            expect(body.message.attachments).toEqual([{
                type: 'text/csv',
                name: 'export.csv',
                content: Buffer.from('csv-rows').toString('base64'),
            }])
        })

        it('fails send when attachment download returns status >= 400', async () => {
            mockHttpsGetWithStream({ statusCode: 503 })

            const adapter = new EmailAdapter()
            await expect(adapter.send({
                to: 'user@example.com',
                subject: 'With attachment',
                html: '<p>See file</p>',
                meta: {
                    attachments: [{
                        publicUrl: ATTACHMENT_URL,
                        mimetype: 'text/plain',
                        originalFilename: 'doc.txt',
                    }],
                },
            })).rejects.toThrow('Failed to download attachment: 503')
        })

        it('fails send when attachment download request errors', async () => {
            mockHttpsGetWithStream({ error: new Error('ECONNRESET') })

            const adapter = new EmailAdapter()
            await expect(adapter.send({
                to: 'user@example.com',
                subject: 'With attachment',
                html: '<p>See file</p>',
                meta: {
                    attachments: [{
                        publicUrl: ATTACHMENT_URL,
                        mimetype: 'text/plain',
                        originalFilename: 'doc.txt',
                    }],
                },
            })).rejects.toThrow('ECONNRESET')
        })
    })

    describe('Sendsay adapter', () => {
        beforeEach(() => {
            process.env.EMAIL_API_CONFIG = JSON.stringify(SENDSAY_CONFIG)
        })

        it('marks adapter as configured when EMAIL_API_CONFIG type is sendsay', () => {
            const adapter = new EmailAdapter()
            expect(adapter.isConfigured).toBe(true)
            expect(adapter.provider).toBe(EMAIL_ADAPTER_TYPE_SENDSAY)
        })

        it('marks adapter as not configured when sendsay auth fields are missing', () => {
            process.env.EMAIL_API_CONFIG = JSON.stringify({
                type: EMAIL_ADAPTER_TYPE_SENDSAY,
                api_url: SENDSAY_CONFIG.api_url,
                from: SENDSAY_CONFIG.from,
            })

            const adapter = new EmailAdapter()
            expect(adapter.isConfigured).toBe(false)
        })

        it('sends transactional email via issue.send personal payload', async () => {
            fetch.mockResolvedValue(createJsonResponse(200, {
                session: 'abc',
                'track.id': 12345,
            }))

            const adapter = new EmailAdapter()
            const [isOk, context] = await adapter.send({
                to: 'user@example.com',
                emailFrom: 'Support <support@example.com>',
                subject: 'Hello from Sendsay',
                text: 'Plain text',
                html: '<b>HTML</b>',
                messageType: 'SHARE_TICKET',
                meta: { attachingData: { organizationId: 'org-1' } },
            })

            expect(isOk).toBe(true)
            expect(context['track.id']).toBe(12345)

            const [calledUrl, calledOpts] = fetch.mock.calls[0]
            expect(calledUrl).toBe(`${SENDSAY_CONFIG.api_url}/${SENDSAY_CONFIG.login}`)
            expect(calledOpts.method).toBe('POST')
            expect(calledOpts.headers).toEqual({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            })

            const body = JSON.parse(calledOpts.body)
            expect(body).toMatchObject({
                action: 'issue.send',
                group: 'personal',
                sendwhen: 'now',
                'users.list': 'user@example.com',
                one_time_auth: {
                    login: SENDSAY_CONFIG.login,
                    sublogin: SENDSAY_CONFIG.sublogin,
                    passwd: SENDSAY_CONFIG.passwd,
                },
                letter: {
                    subject: 'Hello from Sendsay',
                    'from.email': 'noreply@example.com',
                    'from.name': 'Condo',
                    'reply.email': 'support@example.com',
                    'reply.name': 'Support',
                    label: ['SHARE_TICKET'],
                    'customer.id': JSON.stringify({ organizationId: 'org-1' }),
                    message: {
                        html: '<b>HTML</b>',
                        text: 'Plain text',
                    },
                },
            })
            expect(body.login).toBeUndefined()
            expect(body.passwd).toBeUndefined()
        })

        it('uses apikey auth when token is provided', async () => {
            process.env.EMAIL_API_CONFIG = JSON.stringify({
                ...SENDSAY_CONFIG,
                token: 'sendsay-api-key',
                passwd: undefined,
            })
            fetch.mockResolvedValue(createJsonResponse(200, { 'track.id': 99 }))

            const adapter = new EmailAdapter()
            const [isOk] = await adapter.send({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'Body',
            })

            expect(isOk).toBe(true)
            const body = JSON.parse(fetch.mock.calls[0][1].body)
            expect(body.apikey).toBe('sendsay-api-key')
            expect(body.one_time_auth).toBeUndefined()
        })

        it('downloads attachments and maps them to letter.attaches', async () => {
            mockHttpsGetWithStream({ content: ATTACHMENT_CONTENT })
            fetch.mockResolvedValue(createJsonResponse(200, { 'track.id': 7 }))

            const adapter = new EmailAdapter()
            const [isOk] = await adapter.send({
                to: 'user@example.com',
                subject: 'With attachment',
                text: 'See file',
                meta: {
                    attachments: [{
                        publicUrl: ATTACHMENT_URL,
                        mimetype: 'text/plain',
                        originalFilename: 'doc.txt',
                    }],
                },
            })

            expect(isOk).toBe(true)
            const body = JSON.parse(fetch.mock.calls[0][1].body)
            expect(body.letter.attaches).toEqual([{
                name: 'doc.txt',
                content: Buffer.from(ATTACHMENT_CONTENT).toString('base64'),
                encoding: 'base64',
                'mime-type': 'text/plain',
            }])
        })

        it('checkIsAvailable uses authenticated sys.settings.get', async () => {
            fetch.mockResolvedValue(createJsonResponse(200, { list: { 'about.id': 123 } }))

            const adapter = new EmailAdapter()
            await expect(adapter.checkIsAvailable()).resolves.toBe(true)

            expect(fetch.mock.calls[0][0]).toBe(`${SENDSAY_CONFIG.api_url}/${SENDSAY_CONFIG.login}`)
            const body = JSON.parse(fetch.mock.calls[0][1].body)
            expect(body).toEqual({
                action: 'sys.settings.get',
                list: ['about.id'],
                one_time_auth: {
                    login: SENDSAY_CONFIG.login,
                    sublogin: SENDSAY_CONFIG.sublogin,
                    passwd: SENDSAY_CONFIG.passwd,
                },
            })
        })

        it('does not duplicate login when api_url already includes account path', async () => {
            process.env.EMAIL_API_CONFIG = JSON.stringify({
                ...SENDSAY_CONFIG,
                api_url: `${SENDSAY_CONFIG.api_url}/${SENDSAY_CONFIG.login}`,
            })
            fetch.mockResolvedValue(createJsonResponse(200, { 'track.id': 1 }))

            const adapter = new EmailAdapter()
            await adapter.send({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'Body',
            })

            expect(fetch.mock.calls[0][0]).toBe(`${SENDSAY_CONFIG.api_url}/${SENDSAY_CONFIG.login}`)
        })

        it('rejects cc and bcc because sendsay semantics differ', async () => {
            const adapter = new EmailAdapter()
            await expect(adapter.send({
                to: 'user@example.com',
                cc: 'copy@example.com',
                subject: 'Hello',
                text: 'Body',
            })).rejects.toThrow('Sendsay adapter does not support cc or bcc')
        })
    })

    describe('EmailAdapter facade', () => {
        it('throws for unknown type from EMAIL_ADAPTERS registry', () => {
            expect(() => new EmailAdapter({
                type: 'unknown',
                api_url: 'https://example.com',
                token: 'token',
                from: 'noreply@example.com',
            })).toThrow('Unknown email adapter: unknown')
        })

        it('rejects empty required fields via zod config validation', () => {
            const adapter = new EmailAdapter({
                api_url: '',
                token: 'token',
                from: 'noreply@example.com',
            })
            expect(adapter.isConfigured).toBe(false)
        })

        it('keeps undeclared config fields after zod validation', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue({ id: 'ok' }),
                text: jest.fn().mockResolvedValue('{"id":"ok"}'),
            })

            const adapter = new EmailAdapter({
                ...MAILGUN_CONFIG,
                doNotSendEmails: true,
                customProviderOption: 'keep-me',
            })
            expect(adapter.isConfigured).toBe(true)

            await adapter.send({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'Plain text',
            })

            // Adapter still works; undeclared keys must not fail validation
            expect(fetch).toHaveBeenCalled()
        })

        it('throws no EMAIL_API_CONFIG when env is missing', async () => {
            delete process.env.EMAIL_API_CONFIG
            const adapter = new EmailAdapter()
            expect(adapter.isConfigured).toBe(false)
            await expect(adapter.send({
                to: 'user@example.com',
                subject: 'Hi',
                text: 'body',
            })).rejects.toThrow('no EMAIL_API_CONFIG')
        })

        it('defaults to mailgun when type field is omitted', () => {
            process.env.EMAIL_API_CONFIG = JSON.stringify(MAILGUN_CONFIG)

            const adapter = new EmailAdapter()
            expect(adapter.isConfigured).toBe(true)
            expect(adapter.provider).toBe(EMAIL_ADAPTER_TYPE_MAILGUN)
        })
    })
})
