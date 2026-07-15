jest.mock('@open-condo/keystone/fetch', () => ({ fetch: jest.fn() }))

const { fetch } = require('@open-condo/keystone/fetch')

const {
    EmailAdapter,
    EMAIL_ADAPTER_TYPE_MAILGUN,
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

const ENV_KEYS = ['EMAIL_API_CONFIG']

const createJsonResponse = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
})

describe('Email adapters', () => {
    const originalEnv = {}

    beforeAll(() => {
        ENV_KEYS.forEach((key) => {
            originalEnv[key] = process.env[key]
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
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

        it('checkIsAvailable returns true when auth is accepted', async () => {
            fetch.mockResolvedValue({ ok: false, status: 405 })

            const adapter = new EmailAdapter()
            await expect(adapter.checkIsAvailable()).resolves.toBe(true)
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
