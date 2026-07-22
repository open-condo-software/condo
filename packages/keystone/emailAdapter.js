const http = require('http')
const https = require('https')

const FormData = require('form-data')
const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const { z } = require('zod')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')


const logger = getLogger()

const HTTPX_REGEXP = /^http:/
const DEFAULT_ATTACHMENT_DOWNLOAD_TIMEOUT_MS = 30000
const DEFAULT_MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024

const EmailApiConfigSchema = z.object({
    api_url: z.string().min(1).optional(),
    from: z.string().min(1),
    doNotSendEmails: z.boolean().optional(),
}).loose().refine(
    (data) => data.doNotSendEmails === true || (typeof data.api_url === 'string' && data.api_url.length > 0),
    { message: 'api_url is required unless doNotSendEmails is true', path: ['api_url'] },
)

const validateConfig = (config, required, type) => {
    const missedFields = required.filter(field => !get(config, field))
    if (!isEmpty(missedFields)) {
        logger.error({
            msg: 'missing fields in EMAIL_API_CONFIG',
            data: { type, missedFields },
        })
        return false
    }
    return true
}

/**
 * Parses "Name <email@example.com>" or bare "email@example.com" into parts.
 * @param {string|null|undefined} value
 * @returns {{ email: string|null, name: string|null }}
 */
const parseNamedEmail = (value) => {
    if (!value || typeof value !== 'string') {
        return { email: null, name: null }
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return { email: null, name: null }
    }

    const openIdx = trimmed.indexOf('<')
    const closeIdx = trimmed.lastIndexOf('>')
    if (openIdx !== -1 && closeIdx > openIdx) {
        const email = trimmed.slice(openIdx + 1, closeIdx).trim()
        if (email.includes('@') && !email.includes('<') && !email.includes('>')) {
            const name = trimmed.slice(0, openIdx).trim().replace(/^["']|["']$/g, '')
            return {
                email,
                name: name || null,
            }
        }
    }

    if (trimmed.includes('@')) {
        return { email: trimmed, name: null }
    }

    return { email: null, name: null }
}

/**
 * Splits comma-separated address list into bare email addresses.
 * @param {string|null|undefined} value
 * @returns {string[]}
 */
const parseEmailList = (value) => {
    if (!value) return []

    return String(value)
        .split(',')
        .map((part) => parseNamedEmail(part).email)
        .filter(Boolean)
}

const resolveAttachmentOptions = (config = {}) => {
    const timeoutMs = Number(config.attachmentDownloadTimeoutMs)
    const maxSizeBytes = Number(config.maxAttachmentSizeBytes)

    return {
        timeoutMs: timeoutMs > 0 ? timeoutMs : DEFAULT_ATTACHMENT_DOWNLOAD_TIMEOUT_MS,
        maxSizeBytes: maxSizeBytes > 0 ? maxSizeBytes : DEFAULT_MAX_ATTACHMENT_SIZE_BYTES,
    }
}

const fetchAttachmentStream = (publicUrl, timeoutMs = DEFAULT_ATTACHMENT_DOWNLOAD_TIMEOUT_MS) => {
    return new Promise((resolve, reject) => {
        const httpx = HTTPX_REGEXP.test(publicUrl) ? http : https
        let settled = false
        let timeoutId = null

        const clearDownloadTimeout = () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId)
                timeoutId = null
            }
        }

        const settleReject = (error) => {
            if (settled) return
            settled = true
            clearDownloadTimeout()
            reject(error)
        }

        const request = httpx.get(publicUrl, (stream) => {
            const statusCode = stream.statusCode
            if (statusCode && statusCode >= 400) {
                stream.resume()
                settleReject(new Error(`Failed to download attachment: ${statusCode}`))
                return
            }
            if (settled) return
            settled = true
            // Keep timeout active until the stream body is fully buffered.
            stream.clearDownloadTimeout = clearDownloadTimeout
            resolve(stream)
        })

        timeoutId = setTimeout(() => {
            const err = new Error(`Attachment download timed out after ${timeoutMs}ms`)
            request.destroy(err)
            settleReject(err)
        }, timeoutMs)

        request.on('error', settleReject)
    })
}

const streamToBuffer = async (stream, maxSize = DEFAULT_MAX_ATTACHMENT_SIZE_BYTES) => {
    const chunks = []
    let totalSize = 0

    try {
        for await (const chunk of stream) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            totalSize += buffer.length
            if (totalSize > maxSize) {
                if (typeof stream.destroy === 'function') {
                    stream.destroy()
                }
                throw new Error(`Attachment exceeds maximum size of ${maxSize} bytes`)
            }
            chunks.push(buffer)
        }

        return Buffer.concat(chunks)
    } finally {
        if (typeof stream.clearDownloadTimeout === 'function') {
            stream.clearDownloadTimeout()
        }
    }
}

const downloadAttachment = async (publicUrl, { timeoutMs, maxSizeBytes } = {}) => {
    const stream = await fetchAttachmentStream(publicUrl, timeoutMs)
    return await streamToBuffer(stream, maxSizeBytes)
}

const resolveAttachmentBuffer = async (attachment, options = {}) => {
    const maxSizeBytes = options.maxSizeBytes || DEFAULT_MAX_ATTACHMENT_SIZE_BYTES

    if (attachment.buffer != null) {
        const buffer = Buffer.isBuffer(attachment.buffer)
            ? attachment.buffer
            : Buffer.from(attachment.buffer)
        if (buffer.length > maxSizeBytes) {
            throw new Error(`Attachment exceeds maximum size of ${maxSizeBytes} bytes`)
        }
        return buffer
    }

    if (attachment.publicUrl) {
        return await downloadAttachment(attachment.publicUrl, options)
    }

    throw new Error('attachment must provide publicUrl or buffer')
}

/**
 * Resolves `meta.inlineAttachments` the same way as regular attachments.
 * @returns {Promise<Array<{ originalFilename: string, mimetype: string, buffer: Buffer }>>}
 */
const resolveInlineAttachments = async (meta, attachmentOptions) => {
    if (!meta || !meta.inlineAttachments) return []

    return Promise.all(meta.inlineAttachments.map(async (attachment) => {
        const { mimetype, originalFilename } = attachment
        const buffer = await resolveAttachmentBuffer(attachment, attachmentOptions)
        return {
            originalFilename: originalFilename || 'inline',
            mimetype: mimetype || 'application/octet-stream',
            buffer,
        }
    }))
}

/**
 * Rewrites `cid:filename` references in HTML to data URIs (for non-Mailgun providers).
 * @param {string|null|undefined} html
 * @param {Array<{ originalFilename: string, mimetype: string, buffer: Buffer }>} inlines
 * @returns {string|null|undefined}
 */
const applyInlineAttachmentsToHtml = (html, inlines) => {
    if (!html || isEmpty(inlines)) return html

    let result = html
    for (const inline of inlines) {
        const filename = inline.originalFilename
        if (!filename) continue
        const dataUri = `data:${inline.mimetype};base64,${inline.buffer.toString('base64')}`
        result = result.split(`cid:${filename}`).join(dataUri)
    }
    return result
}

class MailgunEmail {
    static type = 'mailgun'

    isConfigured = false

    constructor (config) {
        this.isConfigured = validateConfig(config, ['api_url', 'token', 'from'], MailgunEmail.type)
        if (!this.isConfigured) return
        this.api_url = config.api_url
        this.token = config.token
        this.from = config.from
        this.useTags = Boolean(config.useTags)
        this.useAttachingData = Boolean(config.useAttachingData)
        this.attachmentOptions = resolveAttachmentOptions(config)
        this.isConfigured = true
    }

    isEmailSupported (email) {
        return typeof email === 'string' && email.includes('@')
    }

    async checkIsAvailable () {
        if (!this.isConfigured) return false

        try {
            const auth = `api:${this.token}`
            const result = await fetch(
                this.api_url,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
                    },
                },
            )
            // Messages endpoint rejects GET with 405 when auth is valid.
            return result.status === 405
        } catch (error) {
            return false
        }
    }

    async send ({ to, emailFrom = null, cc, bcc, subject, text, html, meta, messageType } = {}, extendedParams = {}) {
        const form = new FormData()
        form.append('from', this.from)

        if (this.useTags && (!!messageType && typeof messageType === 'string')) {
            form.append('o:tag', messageType)
        }
        if (this.useAttachingData && meta && !isEmpty(meta.attachingData)) {
            form.append('v:attachingData', JSON.stringify(meta.attachingData))
        }

        if (emailFrom) {
            form.append('h:Reply-To', emailFrom)
        }
        form.append('to', to)
        form.append('subject', subject)
        if (text) form.append('text', text)
        if (cc) form.append('cc', cc)
        if (bcc) form.append('bcc', bcc)
        if (html) form.append('html', html)

        Object.entries(extendedParams).forEach(([key, value]) => {
            if (value === undefined || value === null) return
            form.append(key, typeof value === 'string' ? value : JSON.stringify(value))
        })

        if (meta && meta.attachments) {
            const attachmentsData = await Promise.all(meta.attachments.map(async (attachment) => {
                const { mimetype, originalFilename } = attachment
                const buffer = await resolveAttachmentBuffer(attachment, this.attachmentOptions)
                return { originalFilename, mimetype, buffer }
            }))
            attachmentsData.forEach((attachmentData) => {
                const { originalFilename, mimetype, buffer } = attachmentData
                form.append(
                    'attachment',
                    buffer,
                    {
                        filename: originalFilename || 'attachment',
                        contentType: mimetype || 'application/octet-stream',
                    },
                )
            })
        }

        const inlineAttachments = await resolveInlineAttachments(meta, this.attachmentOptions)
        inlineAttachments.forEach(({ originalFilename, mimetype, buffer }) => {
            form.append(
                'inline',
                buffer,
                {
                    filename: originalFilename,
                    contentType: mimetype,
                },
            )
        })

        const auth = `api:${this.token}`
        const result = await fetch(
            this.api_url,
            {
                method: 'POST',
                body: form,
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
                },
            },
        )
        const status = result.status
        const responseText = await result.text()

        if (status !== 200) {
            return [false, { text: responseText, status }]
        }

        try {
            return [true, JSON.parse(responseText)]
        } catch (error) {
            return [true, { text: responseText }]
        }
    }
}
/**
 * Unisender Go transactional email API adapter.
 * @see https://godocs.unisender.ru/web-api-ref#email-send
 */
class UnisenderGoEmail {
    static type = 'unisendergo'

    isConfigured = false

    static normalizeApiUrl (apiUrl) {
        if (!apiUrl || typeof apiUrl !== 'string') return ''
        return apiUrl.replace(/\/+$/, '')
    }

    constructor (config) {
        this.isConfigured = validateConfig(config, ['api_url', 'token', 'from'], UnisenderGoEmail.type)
        if (!this.isConfigured) return
        const { email: fromEmail, name: fromName } = parseNamedEmail(config.from)
        if (!fromEmail) {
            logger.error({
                msg: 'invalid from field in EMAIL_API_CONFIG',
                data: { type: UnisenderGoEmail.type },
            })
            return
        }

        this.api_url = UnisenderGoEmail.normalizeApiUrl(config.api_url)
        this.apiKey = config.token
        this.fromEmail = fromEmail
        this.fromName = fromName
        this.useTags = Boolean(config.useTags)
        this.useAttachingData = Boolean(config.useAttachingData)
        this.attachmentOptions = resolveAttachmentOptions(config)
        this.isConfigured = true
    }

    _headers () {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-KEY': this.apiKey,
        }
    }

    isEmailSupported (email) {
        return typeof email === 'string' && email.includes('@')
    }

    async checkIsAvailable () {
        if (!this.isConfigured) return false

        try {
            const result = await fetch(
                `${this.api_url}/email-validation/single.json`,
                {
                    method: 'POST',
                    headers: this._headers(),
                    body: JSON.stringify({ email: this.fromEmail }),
                },
            )
            if (!result.ok) return false

            const json = await result.json()
            // Validation endpoint returns result for a single email; any non-auth JSON means API is reachable.
            return Boolean(json) && json.status !== 'error'
        } catch (error) {
            return false
        }
    }

    async send ({ to, emailFrom = null, cc, bcc, subject, text, html, meta, messageType } = {}, extendedParams = {}) {
        const toEmails = parseEmailList(to)
        const ccEmails = parseEmailList(cc)
        const bccEmails = parseEmailList(bcc)

        if (isEmpty(toEmails)) {
            throw new Error('unsupported to argument format')
        }

        const recipients = [...toEmails, ...ccEmails, ...bccEmails].map((email) => ({ email }))
        const message = {
            recipients,
            from_email: this.fromEmail,
            subject,
            body: {},
        }

        if (this.fromName) {
            message.from_name = this.fromName
        }

        const inlineAttachments = await resolveInlineAttachments(meta, this.attachmentOptions)
        const htmlWithInlines = applyInlineAttachmentsToHtml(html, inlineAttachments)
        if (htmlWithInlines) {
            message.body.html = htmlWithInlines
        }
        if (text) {
            message.body.plaintext = text
        }

        const replyTo = parseNamedEmail(emailFrom)
        if (replyTo.email) {
            message.reply_to = replyTo.email
            if (replyTo.name) {
                message.reply_to_name = replyTo.name
            }
        }

        if (this.useTags && messageType && typeof messageType === 'string') {
            message.tags = [messageType]
        }

        if (this.useAttachingData && meta && !isEmpty(meta.attachingData)) {
            message.global_metadata = {
                attachingData: typeof meta.attachingData === 'string'
                    ? meta.attachingData
                    : JSON.stringify(meta.attachingData),
            }
        }

        if (!isEmpty(ccEmails) || !isEmpty(bccEmails)) {
            // Unisender Go requires To/CC headers for multi-recipient copy semantics.
            // @see https://godocs.unisender.ru/cc-and-bcc
            message.headers = {
                To: to,
            }
            if (cc) {
                message.headers.CC = cc
            }
        }

        if (meta && meta.attachments) {
            message.attachments = await Promise.all(meta.attachments.map(async (attachment) => {
                const { mimetype, originalFilename } = attachment
                const buffer = await resolveAttachmentBuffer(attachment, this.attachmentOptions)
                return {
                    type: mimetype || 'application/octet-stream',
                    name: originalFilename || 'attachment',
                    content: buffer.toString('base64'),
                }
            }))
        }

        // Allow callers to pass through supported Unisender Go message fields.
        Object.assign(message, extendedParams)

        const result = await fetch(
            `${this.api_url}/email/send.json`,
            {
                method: 'POST',
                headers: this._headers(),
                body: JSON.stringify({ message }),
            },
        )

        const responseText = await result.text()
        let context
        try {
            context = JSON.parse(responseText)
        } catch (error) {
            return [false, { text: responseText, status: result.status }]
        }

        const isSent = result.ok && get(context, 'status') === 'success'
        if (!isSent && !get(context, 'status')) {
            return [false, { ...context, status: result.status, text: responseText }]
        }

        return [isSent, context]
    }
}

/**
 * Sendsay transactional email adapter.
 * Uses `issue.send` with `group: "personal"`.
 * Auth: `apikey`/`token`, or `one_time_auth` with `login` / optional `sublogin` / `passwd`.
 * `api_url` may be the base JSON endpoint (`.../json`) — account login is appended automatically.
 * @see https://sendsay.ru/api/api.html
 */
class SendsayEmail {
    static type = 'sendsay'

    isConfigured = false

    /**
     * Sendsay JSON API requires account code in the path:
     * `https://api.sendsay.ru/general/api/v100/json/ACCOUNT`
     */
    static buildApiUrl (apiUrl, login) {
        const base = (!apiUrl || typeof apiUrl !== 'string') ? '' : apiUrl.replace(/\/+$/, '')
        if (!base || !login) return base

        const encodedLogin = encodeURIComponent(login)
        const suffix = `/${login}`
        const encodedSuffix = `/${encodedLogin}`
        if (base.endsWith(suffix) || base.endsWith(encodedSuffix)) {
            return base
        }

        return `${base}${encodedSuffix}`
    }

    constructor (config) {
        const hasApiKey = Boolean(config.apikey || config.token)
        const required = hasApiKey
            ? ['api_url', 'from', 'login']
            : ['api_url', 'from', 'login', 'passwd']
        this.isConfigured = validateConfig(config, required, SendsayEmail.type)
        if (!this.isConfigured) return

        const { email: fromEmail, name: fromName } = parseNamedEmail(config.from)
        if (!fromEmail) {
            logger.error({
                msg: 'invalid from field in EMAIL_API_CONFIG',
                data: { type: SendsayEmail.type },
            })
            return
        }

        this.login = config.login
        this.sublogin = config.sublogin
        this.passwd = config.passwd
        this.apikey = config.apikey || config.token || null
        this.api_url = SendsayEmail.buildApiUrl(config.api_url, this.login)
        this.fromEmail = fromEmail
        this.fromName = fromName
        this.useTags = Boolean(config.useTags)
        this.useAttachingData = Boolean(config.useAttachingData)
        this.attachmentOptions = resolveAttachmentOptions(config)
        this.isConfigured = true
    }

    _buildAuthPayload (payload) {
        if (this.apikey) {
            return {
                ...payload,
                apikey: this.apikey,
            }
        }

        return {
            ...payload,
            one_time_auth: {
                login: this.login,
                passwd: this.passwd,
                ...(this.sublogin ? { sublogin: this.sublogin } : {}),
            },
        }
    }

    isEmailSupported (email) {
        return typeof email === 'string' && email.includes('@')
    }

    async checkIsAvailable () {
        if (!this.isConfigured) return false

        try {
            const result = await fetch(
                this.api_url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(this._buildAuthPayload({
                        action: 'sys.settings.get',
                        list: ['about.id'],
                    })),
                },
            )
            if (!result.ok) return false

            const json = await result.json()
            return !get(json, 'errors') && Boolean(get(json, ['list', 'about.id']))
        } catch (error) {
            return false
        }
    }

    async send ({ to, emailFrom = null, cc, bcc, subject, text, html, meta, messageType } = {}, extendedParams = {}) {
        if (cc || bcc) {
            throw new Error('Sendsay adapter does not support cc or bcc')
        }

        const toEmails = parseEmailList(to)
        if (isEmpty(toEmails)) {
            throw new Error('unsupported to argument format')
        }

        const { email: replyEmail, name: replyName } = parseNamedEmail(emailFrom)
        const letter = {
            subject,
            'from.email': this.fromEmail,
            message: {},
        }

        if (this.fromName) {
            letter['from.name'] = this.fromName
        }
        if (replyEmail) {
            letter['reply.email'] = replyEmail
        }
        if (replyName) {
            letter['reply.name'] = replyName
        }

        const inlineAttachments = await resolveInlineAttachments(meta, this.attachmentOptions)
        const htmlWithInlines = applyInlineAttachmentsToHtml(html, inlineAttachments)
        if (htmlWithInlines) {
            letter.message.html = htmlWithInlines
        }
        if (text) {
            letter.message.text = text
        }
        if (this.useTags && messageType && typeof messageType === 'string') {
            letter.label = [messageType]
        }
        if (this.useAttachingData && meta && !isEmpty(meta.attachingData)) {
            letter['customer.id'] = typeof meta.attachingData === 'string'
                ? meta.attachingData
                : JSON.stringify(meta.attachingData)
        }
        if (meta && meta.attachments) {
            letter.attaches = await Promise.all(meta.attachments.map(async (attachment) => {
                const { mimetype, originalFilename } = attachment
                const buffer = await resolveAttachmentBuffer(attachment, this.attachmentOptions)
                return {
                    name: originalFilename || 'attachment',
                    content: buffer.toString('base64'),
                    encoding: 'base64',
                    'mime-type': mimetype || 'application/octet-stream',
                }
            }))
        }

        const result = await fetch(
            this.api_url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(this._buildAuthPayload({
                    action: 'issue.send',
                    group: 'personal',
                    sendwhen: 'now',
                    letter,
                    'users.list': toEmails.join('\n'),
                    ...extendedParams,
                })),
            },
        )

        const responseText = await result.text()
        let context
        try {
            context = JSON.parse(responseText)
        } catch (error) {
            return [false, { text: responseText, status: result.status }]
        }

        const isSent = result.ok && !get(context, 'errors')
        if (!isSent && !get(context, 'status')) {
            return [false, { ...context, status: result.status, text: responseText }]
        }

        return [isSent, context]
    }
}

/**
 * Register email providers here.
 *
 * To add a new provider:
 * 1. Implement adapter class with static `type` and the EmailAdapter contract
 *    (`isConfigured`, `isEmailSupported`, `checkIsAvailable`, `send`)
 * 2. Add the class to this map
 * 3. Set `EMAIL_API_CONFIG.type` to that `type` value
 */
const EMAIL_ADAPTERS = {
    [MailgunEmail.type]: MailgunEmail,
    [SendsayEmail.type]: SendsayEmail,
    [UnisenderGoEmail.type]: UnisenderGoEmail,
}

const DEFAULT_EMAIL_ADAPTER_TYPE = MailgunEmail.type

const parseAndValidateEmailApiConfig = (rawConfig) => {
    if (!rawConfig) return null

    const result = EmailApiConfigSchema.safeParse(rawConfig)
    if (!result.success) {
        logger.error({
            msg: 'invalid EMAIL_API_CONFIG',
            err: result.error,
        })
        return null
    }

    return result.data
}

const getEmailApiConfig = () => {
    if (!conf.EMAIL_API_CONFIG) return null
    try {
        return parseAndValidateEmailApiConfig(JSON.parse(conf.EMAIL_API_CONFIG))
    } catch (error) {
        logger.error({
            msg: 'failed to parse EMAIL_API_CONFIG',
            err: error,
        })
        return null
    }
}

const resolveAdapterType = (config) => {
    return get(config, 'type') || DEFAULT_EMAIL_ADAPTER_TYPE
}

const isEmailAdapterConfigured = () => {
    const config = getEmailApiConfig()
    if (!config) return false
    if (config.doNotSendEmails) return true
    const AdapterClass = EMAIL_ADAPTERS[resolveAdapterType(config)]
    if (!AdapterClass) return false
    return Boolean(new AdapterClass(config).isConfigured)
}

class EmailAdapter {
    /**
     * @param {object|null|undefined} [config] — raw/parsed `EMAIL_API_CONFIG`; loaded from env when omitted
     */
    constructor (config) {
        this.adapter = null
        this.provider = null
        this.doNotSendEmails = false
        this._isEnvConfigMissing = config === undefined && !conf.EMAIL_API_CONFIG

        const validatedConfig = config === undefined
            ? getEmailApiConfig()
            : parseAndValidateEmailApiConfig(config)

        if (!validatedConfig) {
            return
        }

        this.doNotSendEmails = Boolean(validatedConfig.doNotSendEmails)

        const type = resolveAdapterType(validatedConfig)
        this.provider = type

        // Local/dev configs may only set `from` + `doNotSendEmails` without provider credentials.
        if (this.doNotSendEmails && !validatedConfig.api_url) {
            return
        }

        const AdapterClass = EMAIL_ADAPTERS[type]
        if (!AdapterClass) {
            const err = new Error(`Unknown email adapter: ${type}`)
            logger.error({
                msg: 'unknown type in EMAIL_API_CONFIG',
                err,
                data: { type },
            })
            throw err
        }

        this.adapter = new AdapterClass(validatedConfig)
    }

    get isConfigured () {
        if (this.doNotSendEmails) return true
        return Boolean(this.adapter && this.adapter.isConfigured)
    }

    async checkIsAvailable () {
        if (!this.adapter) return false
        return await this.adapter.checkIsAvailable()
    }

    isEmailSupported (email) {
        if (!this.adapter) return false
        return this.adapter.isEmailSupported(email)
    }

    /**
     * @param {Object} args
     * @param {string} args.to
     * @param {string?} args.emailFrom
     * @param {string?} args.cc
     * @param {string?} args.bcc
     * @param {string} args.subject
     * @param {string?} args.text
     * @param {string?} args.html
     * @param {object?} args.meta
     * @param {string?} args.messageType
     * @param {object} [extendedParams]
     * @returns {Promise<[boolean, object]>}
     */
    async send ({ to, emailFrom = null, cc, bcc, subject, text, html, meta, messageType } = {}, extendedParams = {}) {
        if (!this.isConfigured) {
            throw new Error(this._isEnvConfigMissing ? 'no EMAIL_API_CONFIG' : 'email adapter is not configured')
        }
        if (!to || !to.includes('@')) {
            throw new Error('unsupported to argument format')
        }
        if (!subject) {
            throw new Error('no subject argument')
        }
        if (!text && !html) {
            throw new Error('no text or html argument')
        }
        if (this.doNotSendEmails) {
            logger.warn({
                msg: 'email send skipped because doNotSendEmails is enabled',
                data: { to, subject, provider: this.provider },
            })
            return [true, { skipped: true, doNotSendEmails: true }]
        }
        if (!this.isEmailSupported(to)) {
            throw new Error(`Unsupported email address ${to}`)
        }

        return await this.adapter.send({
            to,
            emailFrom,
            cc,
            bcc,
            subject,
            text,
            html,
            meta,
            messageType,
        }, extendedParams)
    }
}

module.exports = {
    EmailAdapter,
    isEmailAdapterConfigured,
    EMAIL_ADAPTER_TYPE_MAILGUN: MailgunEmail.type,
    EMAIL_ADAPTER_TYPE_SENDSAY: SendsayEmail.type,
    EMAIL_ADAPTER_TYPE_UNISENDER_GO: UnisenderGoEmail.type,
}
