import { buildFakeAddressMeta } from '../testSchema/factories'
import { FLAT_WITHOUT_FLAT_TYPE_MESSAGE, getAddressUpToBuildingFrom } from './helpers'
import { catchErrorFrom } from '../testSchema'

describe('helpers', () => {
    describe('getAddressUpToBuildingFrom', () => {
        it('wipes out flat with prefix', () => {
            const withFlat = true
            const addressMeta = buildFakeAddressMeta(withFlat)
            const { address } = addressMeta

            // Try with automatic preparation
            const index = address.lastIndexOf(',')
            const addressWithoutFlat = address.substring(0, index)
            expect(getAddressUpToBuildingFrom(addressMeta)).toEqual(addressWithoutFlat)

            // Try with manual preparation
            addressMeta.value = 'г. Москва, ул. Тверская, д 1, кв. 123'
            addressMeta.data.flat = '123'
            addressMeta.data.flat_type = 'кв.'
            expect(getAddressUpToBuildingFrom(addressMeta)).toEqual('г. Москва, ул. Тверская, д 1')
        })

        it('returns address without flat as is', () => {
            const addressMeta = buildFakeAddressMeta(false)
            const { address } = addressMeta
            expect(getAddressUpToBuildingFrom(addressMeta)).toEqual(address)
        })

        it('throws an error, if flat is presented in addressMeta without flat_type', () => {
            const withFlat = true
            const addressMeta = buildFakeAddressMeta(withFlat)
            addressMeta.data.flat_type = null
            const { address } = addressMeta

            catchErrorFrom(async () => {
                getAddressUpToBuildingFrom(address, addressMeta)
            }, (error) => {
                expect(error.message).toEqual(FLAT_WITHOUT_FLAT_TYPE_MESSAGE)
            })
        })
    })
})
