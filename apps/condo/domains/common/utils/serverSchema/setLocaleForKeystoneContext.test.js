import { setLocaleForKeystoneContext } from './setLocaleForKeystoneContext'
import { catchErrorFrom } from '@open-condo/keystone/test.utils'

describe('setLocaleForKeystoneContext', () => {
    it('sets only supported locale to "context.req"', async () => {
        const context = { }
        setLocaleForKeystoneContext(context, 'ru')
        expect(context.req.locale).toEqual('ru')
        setLocaleForKeystoneContext(context, 'en')
        expect(context.req.locale).toEqual('en')
        await catchErrorFrom(async () => {
            await setLocaleForKeystoneContext(context, 'it')
        }, ({ message }) => {
            expect(message).toEqual('Cannot set locale "it" for Keystone context, because it is currently not supported!')
        })
    })

    it('keeps existing properties of "context.req"', () => {
        const context = {
            req: {
                someExistingProperty: 'that should not be changed',
            },
        }
        setLocaleForKeystoneContext(context, 'ru')
        expect(context.req.someExistingProperty).toEqual('that should not be changed')
        expect(context.req.locale).toEqual('ru')
    })
})