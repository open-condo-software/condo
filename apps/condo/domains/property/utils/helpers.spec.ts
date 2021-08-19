import {
    filtersToQuery,
    sorterToQuery,
    createSorterMap,
    getSortStringFromQuery,
    getPageIndexFromQuery,
    searchToQuery,
    getAddressUpToBuildingFrom,
    FLAT_WITHOUT_FLAT_TYPE_MESSAGE,
} from './helpers'

import { buildFakeAddressMeta } from '@condo/domains/common/utils/testSchema/factories'
const { catchErrorFrom } = require('@condo/domains/common/utils/testSchema')

describe('Helpers property', () => {
    describe('queryUtils property', () => {

        describe('filtersToQuery', () => {
            describe('it should correctly generate query if', () => {
                it('all filters are defined', () => {
                    const address = 'address'
                    const search = 'search'

                    expect(filtersToQuery({
                        address,
                        search,
                    })).toStrictEqual(
                        { AND: [
                            { address_contains_i: 'address' },
                            { OR: [{ address_contains_i: 'search' }] },
                        ] })
                })
                describe('only filter', () => {
                    it('address is defined', () => {
                        const address = 'address'
                        expect(filtersToQuery({ address })).toStrictEqual({ AND: [ { address_contains_i: 'address' } ] })
                    })
                })

                it('search is defined', () => {
                    const search = 'search'

                    expect(filtersToQuery({ search })).toStrictEqual({
                        AND: [
                            { OR: [{ address_contains_i: 'search' }] },
                        ],
                    })
                })
            })
            it('should not generate query if no filters are provided', () => {
                expect(filtersToQuery({})).toBeUndefined()
            })
        })

        describe('sorterToQuery', () => {
            describe('should correctly generate query from sorter', () => {
                it('if sorter is Array if objects', () => {
                    expect(sorterToQuery([
                        { columnKey: 'column1', order: 'ascend' },
                        { columnKey: 'column2', order: 'descend' },
                    ])).toStrictEqual(['column1_ASC', 'column2_DESC'])
                })

                it('if sorter is Single object', () => {
                    expect(sorterToQuery({
                        columnKey: 'column1',
                        order: 'ascend',
                    })).toStrictEqual(['column1_ASC'])
                })
            })

            it('should drop sort if order is invalid', () => {
                expect(sorterToQuery([
                    { columnKey: 'column1', order: 'ascend' },
                    // @ts-ignore
                    { columnKey: 'column2', order: 'invalid_descend' },
                ])).toStrictEqual(['column1_ASC'])
            })

            it('should not generate query if no sort is provided', () => {
                expect(sorterToQuery()).toBeUndefined()
            })
        })

        describe('createSorterMap', () => {
            it('should correctly create sorter map from query', () => {
                const sorterQuery = sorterToQuery([
                    { columnKey: 'address', order: 'ascend' },
                ])

                expect(createSorterMap(sorterQuery)).toStrictEqual({
                    address: 'ascend',
                })
            })

            describe('should correctly drop invalid sorter from query', () => {
                it('if columnKey is invalid', () => {
                    const sorterQuery = sorterToQuery([
                        { columnKey: 'address', order: 'ascend' },
                        { columnKey: 'invalid', order: 'descend' },
                    ])

                    expect(createSorterMap(sorterQuery)).toStrictEqual({
                        address: 'ascend',
                    })
                })

                it('if order is invalid', () => {
                    const sorterQuery = sorterToQuery([
                        // @ts-ignore
                        { columnKey: 'address', order: 'invalid' },
                    ])

                    expect(createSorterMap(sorterQuery)).toStrictEqual({})
                })
            })
        })

        describe('getSortStringFromQuery', () => {
            describe('extract sort string from query object if', () => {
                it('if sort is array', () => {
                    expect(getSortStringFromQuery({ sort: ['1', '2', '3'] })).toStrictEqual(['1', '2', '3'])
                })

                it('if sort is string', () => {
                    expect(getSortStringFromQuery({ sort: '1,2,3' })).toStrictEqual(['1', '2', '3'])
                })
            })
        })

        describe('getPageIndexFromQuery', () => {
            describe('extract pagination page based on offset string from query object if offset', () => {
                it('is valid rounded value', () => {
                    expect(getPageIndexFromQuery({ offset: '0' })).toStrictEqual(1)
                    expect(getPageIndexFromQuery({ offset: '10' })).toStrictEqual(2)
                    expect(getPageIndexFromQuery({ offset: '20' })).toStrictEqual(3)
                })

                it('is valid not rounded to tenths', () => {
                    expect(getPageIndexFromQuery({ offset: '29' })).toStrictEqual(3)
                })

                it('is valid and not defined', () => {
                    expect(getPageIndexFromQuery({ offset: undefined })).toStrictEqual(1)
                })
            })
        })

        describe('searchToQuery', () => {
            describe('it should correctly generate query if', () => {
                const search = 'search'

                it('search is defined', () => {
                    expect(searchToQuery(search)).toStrictEqual([
                        { address_contains_i: search },
                    ])
                })

                it('search is not defined', () => {
                    expect(searchToQuery()).toBeUndefined()
                })
            })
        })

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
})
