import { buildFakeAddressMeta } from '../testSchema/factories'
import { FLAT_WITHOUT_FLAT_TYPE_MESSAGE, getAddressUpToBuildingFrom, normalizePropertyMap } from './helpers'
import { catchErrorFrom } from '@condo/domains/common/utils/testSchema'

describe('helpers', () => {
    describe('getAddressUpToBuildingFrom', () => {
        it('wipes out flat with prefix', () => {
            const withFlat = true
            const addressMeta = buildFakeAddressMeta(withFlat)
            const { value } = addressMeta

            // Try with automatic preparation
            const index = value.lastIndexOf(',')
            const addressWithoutFlat = value.substring(0, index)
            expect(getAddressUpToBuildingFrom(addressMeta)).toEqual(addressWithoutFlat)

            // Try with manual preparation
            addressMeta.value = 'г. Москва, ул. Тверская, д 1, кв. 123'
            addressMeta.data.flat = '123'
            addressMeta.data.flat_type = 'кв.'
            expect(getAddressUpToBuildingFrom(addressMeta)).toEqual('г. Москва, ул. Тверская, д 1')
        })

        it('returns address without flat as is', () => {
            const addressMeta = buildFakeAddressMeta(false)
            const { value } = addressMeta
            expect(getAddressUpToBuildingFrom(addressMeta)).toEqual(value)
        })

        it('throws an error, if flat is presented in addressMeta without flat_type', () => {
            const withFlat = true
            const addressMeta = buildFakeAddressMeta(withFlat)
            addressMeta.data.flat_type = null
            const { value } = addressMeta

            catchErrorFrom(
                async () => {
                    getAddressUpToBuildingFrom(value, addressMeta)
                },
                (error) => {
                    expect(error.message).toEqual(FLAT_WITHOUT_FLAT_TYPE_MESSAGE)
                },
            )
        })
    })

    describe('normalizePropertyMap', () => {
        it('removes all properties with `null` values from `sections[].floors[].units[]` from provided `Property.map`', async () => {
            const map = {
                dv: 1,
                type: 'building',
                sections: [
                    {
                        id: '5',
                        type: 'section',
                        index: 1,
                        name: '1',
                        preview: null,
                        floors: [
                            {
                                id: '7',
                                type: 'floor',
                                index: 1,
                                name: '1',
                                units: [
                                    {
                                        id: '6',
                                        type: 'unit',
                                        name: null,
                                        label: '1',
                                        preview: null,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }
            const mapWithoutNameInUnit = {
                dv: 1,
                type: 'building',
                sections: [
                    {
                        id: '5',
                        type: 'section',
                        index: 1,
                        name: '1',
                        preview: null,
                        floors: [
                            {
                                id: '7',
                                type: 'floor',
                                index: 1,
                                name: '1',
                                units: [
                                    {
                                        id: '6',
                                        type: 'unit',
                                        label: '1',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }
            const sanitizedMap = normalizePropertyMap(map)
            expect(sanitizedMap).toStrictEqual(mapWithoutNameInUnit)
        })
    })
})
