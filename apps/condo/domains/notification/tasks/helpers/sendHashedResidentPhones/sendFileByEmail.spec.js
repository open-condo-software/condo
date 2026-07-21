jest.mock('@open-condo/keystone/emailAdapter', () => ({
    EmailAdapter: jest.fn(),
    isEmailAdapterConfigured: jest.fn(),
}))

const { Readable } = require('stream')

const { EmailAdapter, isEmailAdapterConfigured } = require('@open-condo/keystone/emailAdapter')

const { sendFileByEmail } = require('./sendFileByEmail')


describe('sendFileByEmail', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('sends csv buffer attachment through EmailAdapter', async () => {
        isEmailAdapterConfigured.mockReturnValue(true)
        const send = jest.fn().mockResolvedValue([true, { id: 'msg-1' }])
        EmailAdapter.mockImplementation(() => ({ send }))

        const status = await sendFileByEmail({
            stream: Readable.from(['phone1\n', 'phone2\n']),
            filename: '/tmp/phones.csv',
            toEmail: 'marketing@example.com',
        })

        expect(status).toBe(200)
        expect(send).toHaveBeenCalledWith({
            to: 'marketing@example.com',
            subject: 'Phone numbers export',
            text: 'Phone numbers export',
            meta: {
                attachments: [{
                    buffer: Buffer.from('phone1\nphone2\n'),
                    mimetype: 'text/csv',
                    originalFilename: 'phones.csv',
                }],
            },
        })
    })

    it('throws when email adapter is not configured', async () => {
        isEmailAdapterConfigured.mockReturnValue(false)

        await expect(sendFileByEmail({
            stream: Readable.from(['x']),
            filename: 'phones.csv',
            toEmail: 'marketing@example.com',
        })).rejects.toThrow('no EMAIL_API_CONFIG')
    })

    it('returns provider status when send fails', async () => {
        isEmailAdapterConfigured.mockReturnValue(true)
        const send = jest.fn().mockResolvedValue([false, { status: 502 }])
        EmailAdapter.mockImplementation(() => ({ send }))

        const status = await sendFileByEmail({
            stream: Readable.from(['x']),
            filename: 'phones.csv',
            toEmail: 'marketing@example.com',
        })

        expect(status).toBe(502)
    })
})
