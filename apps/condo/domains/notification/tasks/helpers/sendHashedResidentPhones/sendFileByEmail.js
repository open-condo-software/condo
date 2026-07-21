const path = require('path')

const get = require('lodash/get')

const { EmailAdapter, isEmailAdapterConfigured } = require('@open-condo/keystone/emailAdapter')


const streamToBuffer = async (stream) => {
    const chunks = []
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
}

/**
 * Sends an export file by email through the configured EmailAdapter (Mailgun / Unisender Go).
 * @returns {Promise<number>} HTTP-like status for logging compatibility (200 on success)
 */
async function sendFileByEmail ({ stream, filename, toEmail }) {
    if (!isEmailAdapterConfigured()) {
        throw new Error('no EMAIL_API_CONFIG')
    }

    const buffer = await streamToBuffer(stream)
    const [isOk, context] = await new EmailAdapter().send({
        to: toEmail,
        subject: 'Phone numbers export',
        text: 'Phone numbers export',
        meta: {
            attachments: [{
                buffer,
                mimetype: 'text/csv',
                originalFilename: path.basename(filename),
            }],
        },
    })

    if (isOk) return 200
    return get(context, 'status') || 500
}

module.exports = {
    sendFileByEmail,
}
