const { ExternalContentImplementation } = require('./Implementation')

const createMeta = () => ({
    listAdapter: {
        newFieldAdapter: jest.fn(() => ({})),
    },
    getListByKey: jest.fn(),
    listKey: 'TestList',
    fieldAdapterClass: class {},
    defaultAccess: {
        create: true,
        read: true,
        update: true,
    },
    schemaNames: ['public'],
})

describe('ExternalContent field type', () => {
    describe('ExternalContentImplementation.resolveInput', () => {
        test('saves new file before deleting previous one', async () => {
            const calls = []
            const adapter = {
                save: async () => {
                    calls.push('save')
                    return { id: 'new', filename: 'new.bin' }
                },
                delete: async () => {
                    calls.push('delete')
                },
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const res = await impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: { raw: { id: 'old', filename: 'old.bin' } },
                listKey: 'BillingReceipt',
            })

            expect(res).toEqual({ id: 'new', filename: 'new.bin' })
            expect(calls).toEqual(['save', 'delete'])
        })

        test('does not delete previous file if save fails', async () => {
            const adapter = {
                save: async () => {
                    throw new Error('save failed')
                },
                delete: jest.fn(),
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())

            await expect(impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: { raw: { id: 'old', filename: 'old.bin' } },
                listKey: 'BillingReceipt',
            })).rejects.toThrow('save failed')

            expect(adapter.delete).not.toHaveBeenCalled()
        })

        test('uses listKey for filename prefix', async () => {
            const adapter = {
                save: jest.fn(async () => ({ id: 'new', filename: 'new.bin' })),
                delete: jest.fn(),
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            await impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: null,
                listKey: 'BillingReceipt',
            })

            const saveArgs = adapter.save.mock.calls[0][0]
            expect(saveArgs.filename).toBe('BillingReceipt_raw.json')
        })
    })

    describe('processors', () => {
        test('text/xml deserialize empty string to null', () => {
            const adapter = { save: async () => ({}), delete: async () => undefined }

            const textImpl = new ExternalContentImplementation('raw', { adapter, format: 'text' }, createMeta())
            expect(textImpl.deserialize('')).toBe(null)

            const xmlImpl = new ExternalContentImplementation('raw', { adapter, format: 'xml' }, createMeta())
            expect(xmlImpl.deserialize('')).toBe(null)
        })
    })
})

