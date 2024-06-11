const FormData = require('form-data')

const { fetch } = require('@open-condo/keystone/fetch')


async function sendFileByEmail ({ stream, filename, config, toEmail }) {
    const { api_url, token, from } = config
    const form = new FormData()

    form.append('from', from)
    form.append('to', toEmail)
    form.append('subject', 'Phone numbers export')
    form.append('text', 'Phone numbers export')
    form.append(
        'attachment',
        stream,
        {
            filename: filename,
            contentType: 'text/csv',
        },
    )

    const auth = `api:${token}`
    const result = await fetch(
        api_url,
        {
            method: 'POST',
            body: form,
            headers: {
                ...form.getHeaders(),
                'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
            },
        })

    return result.status
}

module.exports = {
    sendFileByEmail,
}