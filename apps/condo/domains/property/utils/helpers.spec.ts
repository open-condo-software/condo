import {
    filtersToQuery,
    sorterToQuery,
    createSorterMap,
    getSortStringFromQuery,
    getPaginationFromQuery,
    getFiltersFromQuery,
} from './helpers'

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

        describe('getPaginationFromQuery', () => {
            describe('extract pagination page based on offset string from query object if offset', () => {
                it('is valid rounded value', () => {
                    expect(getPaginationFromQuery({ offset: '0' })).toStrictEqual(1)
                    expect(getPaginationFromQuery({ offset: '10' })).toStrictEqual(2)
                    expect(getPaginationFromQuery({ offset: '20' })).toStrictEqual(3)
                })

                it('is valid not rounded to tenths', () => {
                    expect(getPaginationFromQuery({ offset: '29' })).toStrictEqual(3)
                })

                it('is valid and not defined', () => {
                    expect(getPaginationFromQuery({ offset: undefined })).toStrictEqual(1)
                })
            })
        })

        describe('getFiltersFromQuery', () => {
            describe('it should extract filters from query', () => {
                it('if valid JSON is provided', () => {
                    expect(getFiltersFromQuery({ filters: '{"key": "value", "key2": "value"}' })).toStrictEqual({
                        key: 'value',
                        key2: 'value',
                    })
                })
                it('if invalid JSON is provided', () => {
                    expect(getFiltersFromQuery({ filters: '{"key": value, "key2": value}' })).toStrictEqual({})
                })
            })
        })
    })
})
