import {
    searchToQuery,
    filtersToQuery,
    sorterToQuery,
    createSorterMap,
    queryToSorter,
    getPageIndexFromQuery,
    CONTACT_PAGE_SIZE,
} from './helpers'

function randInt(maxValue) {
    return Math.floor(Math.random() * maxValue)
}

describe('Contact Helpers', () => {
    describe('query utils', () => {
        describe('searchToQuery', () => {
            it('should generate searches for all fields on correct input', () => {
                const search = 'stringToSearch'
                expect(searchToQuery(search)).toStrictEqual([
                    { name_contains_i: search },
                    { phone_contains_i: search },
                    { email_contains_i: search },
                    { property: { address_contains_i: search } },
                ])
            })
            it('should not generate anything on undefined/null/empty_string', () => {
                const nullTest = null
                const emptyTest = ''
                expect(searchToQuery()).toBeUndefined()
                expect(searchToQuery(nullTest)).toBeUndefined()
                expect(searchToQuery(emptyTest)).toBeUndefined()
            })
        })
        describe('filtersToQuery', () => {
            const name = 'name'
            const email = 'email'
            const address = 'address'
            const phone = 'phone'
            const search = 'search'
            const filters = [
                { key: name, result: { name_contains_i: name } },
                { key: phone, result: { phone_contains_i: phone } },
                { key: email, result: { email_contains_i: email } },
                { key: address, result: { property: { address_contains_i: address } } },
                {
                    key: search,
                    result: {
                        OR: [
                            { name_contains_i: search },
                            { phone_contains_i: search },
                            { email_contains_i: search },
                            { property: { address_contains_i: search } },
                        ],
                    },
                },
            ]
            describe('should generate correct filters', () => {
                describe('if 1 filter defined', () => {
                    for (let i = 0; i < filters.length; i++) {
                        it(`${filters[i].key}`, () => {
                            const testFilters = {}
                            testFilters[filters[i].key] = filters[i].key
                            expect(filtersToQuery(testFilters)).toStrictEqual({
                                AND: [filters[i].result],
                            })
                        })
                    }
                })
                describe('if 2 filters defined', () => {
                    for (let i = 0; i < filters.length - 1; i++) {
                        for (let j = i + 1; j < filters.length; j++) {
                            it(`${filters[i].key} + ${filters[j].key}`, () => {
                                const testFilters = {}
                                testFilters[filters[i].key] = filters[i].key
                                testFilters[filters[j].key] = filters[j].key
                                expect(filtersToQuery(testFilters)).toStrictEqual({
                                    AND: [filters[i].result, filters[j].result],
                                })
                            })
                        }
                    }
                })
                describe('if 3 filters defined', () => {
                    for (let i = 0; i < filters.length - 2; i++) {
                        for (let j = i + 1; j < filters.length - 1; j++) {
                            for (let k = j + 1; k < filters.length; k++) {
                                it(`${filters[i].key} + ${filters[j].key}`, () => {
                                    const testFilters = {}
                                    testFilters[filters[i].key] = filters[i].key
                                    testFilters[filters[j].key] = filters[j].key
                                    testFilters[filters[k].key] = filters[k].key
                                    expect(filtersToQuery(testFilters)).toStrictEqual({
                                        AND: [filters[i].result, filters[j].result, filters[k].result],
                                    })
                                })
                            }
                        }
                    }
                })
                describe('if 4 filters defined', () => {
                    for (let i = 0; i < filters.length - 3; i++) {
                        for (let j = i + 1; j < filters.length - 2; j++) {
                            for (let k = j + 1; k < filters.length - 1; k++) {
                                for (let l = k + 1; l < filters.length; l++) {
                                    const testFilters = {}
                                    testFilters[filters[i].key] = filters[i].key
                                    testFilters[filters[j].key] = filters[j].key
                                    testFilters[filters[k].key] = filters[k].key
                                    testFilters[filters[l].key] = filters[l].key
                                    expect(filtersToQuery(testFilters)).toStrictEqual({
                                        AND: [filters[i].result, filters[j].result, filters[k].result, filters[l].result],
                                    })
                                }
                            }
                        }
                    }
                })
                it('if all filters defined', () => {
                    const testFilters = {}
                    const result = { AND: [] }
                    for (let i = 0; i < filters.length; i++) {
                        testFilters[filters[i].key] = filters[i].key
                        result.AND.push(filters[i].result)
                    }
                    expect(filtersToQuery(testFilters)).toStrictEqual(result)
                })
            })
            it('should not generate query on empty filters', () => {
                expect(filtersToQuery({})).toBeUndefined()
            })
        })
        describe('sorterToQuery', () => {
            describe('if sorter is Array', () => {
                it('empty array should be empty', () => {
                    expect(sorterToQuery([])).toStrictEqual([])
                })
                it('non-empty correct array', () => {
                    expect(
                        sorterToQuery([
                            { columnKey: 'column1', order: 'ascend' },
                            { columnKey: 'column2', order: 'descend' },
                        ]),
                    ).toStrictEqual(['column1_ASC', 'column2_DESC'])
                })
            })
            it('if sorter is Single object', () => {
                expect(sorterToQuery({ columnKey: 'c', order: 'ascend' })).toStrictEqual(['c_ASC'])
                expect(sorterToQuery({ columnKey: 'c', order: 'descend' })).toStrictEqual(['c_DESC'])
            })
            it('should be empty if sorter is not provided', () => {
                expect(sorterToQuery()).toStrictEqual([])
            })
        })
        describe('createSorterMap', () => {
            describe('should correctly work on correct data', () => {
                it('empty list', () => {
                    expect(createSorterMap([])).toStrictEqual({})
                })
                it('non-empty list', () => {
                    const sorterQuery = sorterToQuery([
                        { columnKey: 'name', order: 'ascend' },
                        { columnKey: 'phone', order: 'descend' },
                        { columnKey: 'email', order: 'descend' },
                        { columnKey: 'address', order: 'ascend' },
                    ])
                    expect(createSorterMap(sorterQuery)).toStrictEqual({
                        name: 'ascend',
                        phone: 'descend',
                        email: 'descend',
                        address: 'ascend',
                    })
                })
            })
            describe('should drop invalid data', () => {
                it('invalid column', () => {
                    const sorterQuery = sorterToQuery([
                        { columnKey: 'name', order: 'ascend' },
                        { columnKey: 'invalid', order: 'ascend' },
                        { columnKey: 'phone', order: 'descend' },
                    ])
                    expect(createSorterMap(sorterQuery)).toStrictEqual({
                        name: 'ascend',
                        phone: 'descend',
                    })
                })
                it('invalid order', () => {
                    const sorterQuery = sorterToQuery([
                        { columnKey: 'name', order: 'ascend' },
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //@ts-ignore
                        { columnKey: 'email', order: 'up' },
                        { columnKey: 'phone', order: 'descend' },
                    ])
                    expect(createSorterMap(sorterQuery)).toStrictEqual({
                        name: 'ascend',
                        phone: 'descend',
                    })
                })
            })
        })
        describe('queryToSorter', () => {
            it('valid sorter on valid query', () => {
                expect(queryToSorter(['name_ASC', 'phone_DESC'])).toStrictEqual([
                    { columnKey: 'name', order: 'ascend' },
                    { columnKey: 'phone', order: 'descend' },
                ])
            })
            describe('should return empty sorter on invalid data', () => {
                it('if column is invalid', () => {
                    expect(queryToSorter(['invalid_ASC'])).toStrictEqual([])
                })
                it('if no column specified', () => {
                    expect(queryToSorter(['_ASC'])).toStrictEqual([])
                })
                it('if order is invalid', () => {
                    expect(queryToSorter(['name_INVALID'])).toStrictEqual([])
                })
                it('if no order specified', () => {
                    expect(queryToSorter(['name_'])).toStrictEqual([])
                })
                it('if there is no sort string', () => {
                    expect(queryToSorter(['    '])).toStrictEqual([])
                })
                it('if there is empty string', () => {
                    expect(queryToSorter([''])).toStrictEqual([])
                })
                it('if there is empty list', () => {
                    expect(queryToSorter([])).toStrictEqual([])
                })
            })
        })
        describe('getPageIndexFromQuery', () => {
            const query = {}
            const attemps = 10
            const maxOffset = CONTACT_PAGE_SIZE
            it('rounded value test', () => {
                for (let i = 0; i < attemps; i++) {
                    const page = randInt(1000)
                    query['offset'] = page * CONTACT_PAGE_SIZE
                    expect(getPageIndexFromQuery(query)).toStrictEqual(page + 1)
                }
            })
            it('not-rounded value test', () => {
                for (let i = 0; i < attemps; i++) {
                    query['offset'] = i * CONTACT_PAGE_SIZE + randInt(maxOffset)
                    expect(getPageIndexFromQuery(query)).toStrictEqual(i + 1)
                }
            })
            it('first page when not defined', () => {
                expect(getPageIndexFromQuery(undefined)).toStrictEqual(1)
            })
        })
    })
})
