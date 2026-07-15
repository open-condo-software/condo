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
const NAMED_EMAIL_REGEXP = /^(.+?)\s*<\s*([^>]+)\s*>$/
const DEFAULT_ATTACHMENT_DOWNLOAD_TIMEOUT_MS = 30000
const DEFAULT_MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024

const EmailApiConfigSchema = z.object({
    api_url: z.string().min(1),
    token: z.string().min(1),
    from: z.string().min(1),
}).loose()

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

    const namedMatch = trimmed.match(NAMED_EMAIL_REGEXP)
    if (namedMatch) {
        return {
            name: namedMatch[1].trim().replace(/^["']|["']$/g, ''),
            email: namedMatch[2].trim(),
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

const normalizeApiUrl = (apiUrl) => {
    if (!apiUrl || typeof apiUrl !== 'string') return ''
    return apiUrl.replace(/\/+$/, '')
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

        const settle = (handler) => (value) => {
            if (settled) return
            settled = true
            clearTimeout(timeoutId)
            handler(value)
        }

        const request = httpx.get(publicUrl, (stream) => {
            const statusCode = stream.statusCode
            if (statusCode && statusCode >= 400) {
                stream.resume()
                settle(reject)(new Error(`Failed to download attachment: ${statusCode}`))
                return
            }
            settle(resolve)(stream)
        })

        const timeoutId = setTimeout(() => {
            const err = new Error(`Attachment download timed out after ${timeoutMs}ms`)
            request.destroy(err)
            settle(reject)(err)
        }, timeoutMs)

        request.on('error', settle(reject))
    })
}

const streamToBuffer = async (stream, maxSize = DEFAULT_MAX_ATTACHMENT_SIZE_BYTES) => {
    const chunks = []
    let totalSize = 0

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
}

const downloadAttachment = async (publicUrl, { timeoutMs, maxSizeBytes } = {}) => {
    const stream = await fetchAttachmentStream(publicUrl, timeoutMs)
    return await streamToBuffer(stream, maxSizeBytes)
}

class MailgunEmail {
    static type = 'mailgun'

    isConfigured = false

    constructor (config) {
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
        // Messages endpoint typically rejects GET; auth failures are 401/403.
        return result.status !== 401 && result.status !== 403
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
                const { publicUrl, mimetype, originalFilename } = attachment
                const buffer = await downloadAttachment(publicUrl, this.attachmentOptions)
                return { originalFilename, mimetype, buffer }
            }))
            attachmentsData.forEach((attachmentData) => {
                const { originalFilename, mimetype, buffer } = attachmentData
                form.append(
                    'attachment',
                    buffer,
                    {
                        filename: originalFilename,
                        contentType: mimetype,
                    },
                )
            })
        }

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

        let context, isSent
        if (status === 200) {
            isSent = true
            context = await result.json()
        } else {
            const responseText = await result.text()
            isSent = false
            context = { text: responseText, status }
        }
        return [isSent, context]
    }
}

/**
 * Unisender Go transactional email API adapter.
 * @see https://godocs.unisender.ru/web-api-ref#email-send
 */
class UnisenderGoEmail {
    static type = 'unisendergo'

    isConfigured = false

    constructor (config) {
        const { email: fromEmail, name: fromName } = parseNamedEmail(config.from)
        if (!fromEmail) {
            logger.error({
                msg: 'invalid from field in EMAIL_API_CONFIG',
                data: { type: UnisenderGoEmail.type },
            })
            return
        }

        this.api_url = normalizeApiUrl(config.api_url)
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

        const result = await fetch(
            `${this.api_url}/email-validation/single.json`,
            {
                method: 'POST',
                headers: this._headers(),
                body: JSON.stringify({ email: this.fromEmail }),
            },
        )
        if (!result.ok) return false

        try {
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
        if (html) {
            message.body.html = html
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
                const { publicUrl, mimetype, originalFilename } = attachment
                const buffer = await downloadAttachment(publicUrl, this.attachmentOptions)
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

class EmailAdapter {
    /**
     * @param {object|null|undefined} [config] — raw/parsed `EMAIL_API_CONFIG`; loaded from env when omitted
     */
    constructor (config) {
        this.adapter = null
        this.provider = null
        this._isEnvConfigMissing = config === undefined && !conf.EMAIL_API_CONFIG

        const validatedConfig = config === undefined
            ? getEmailApiConfig()
            : parseAndValidateEmailApiConfig(config)

        if (!validatedConfig) {
            return
        }

        const type = resolveAdapterType(validatedConfig)
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

        this.provider = type
        this.adapter = new AdapterClass(validatedConfig)
    }

    get isConfigured () {
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
        if (!this.adapter || !this.isConfigured) {
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
    EMAIL_ADAPTER_TYPE_MAILGUN: MailgunEmail.type,
    EMAIL_ADAPTER_TYPE_UNISENDER_GO: UnisenderGoEmail.type,
}
