import moment from 'moment'
import {
    statusToQuery,
    createdAtToQuery,
    filtersToQuery,
    sorterToQuery,
    createSorterMap,
    getSortStringFromQuery,
    getPaginationFromQuery,
    getFiltersFromQuery, propertyToQuery, executorToQuery, assigneeToQuery, queryToSorter,
} from './helpers'

describe('Helpers', () => {
    describe('queryUtils', () => {
        describe('statusToQuery', () => {
            it('should correctly generate query from status ids', () => {
                const ids = ['0', '1', '2', '3']

                expect(statusToQuery(ids)).toStrictEqual(
                    {
                        AND: [{
                            id_in: ids,
                        }],
                    }
                )
            })

            describe('should not generate query from status ids if ', () => {
                it('ids is not array', () => {
                    const ids = '[\'0\', \'1\', \'2\', \'3\']'

                    //@ts-ignore
                    expect(statusToQuery(ids)).toBeUndefined()
                })

                it('ids is empty array', () => {
                    const ids = []

                    expect(statusToQuery(ids)).toBeUndefined()
                })
            })
        })

        describe('createdAtToQuery', () => {
            it('should correctly generate query date range from createdAt', () => {
                const date = moment()
                const minDate = date.startOf('day').toISOString()
                const maxDate = date.endOf('day').toISOString()

                expect(createdAtToQuery(date.toISOString())).toStrictEqual([
                    minDate,
                    maxDate,
                ])
            })

            describe('should not generate query date range from createdAt if', () => {
                it('createdAt is not defined', () => {
                    expect(createdAtToQuery()).toBeUndefined()
                })

                it('createdAt is invalid date', () => {
                    expect(createdAtToQuery('invalid date')).toBeUndefined()
                })
            })
        })

        describe('propertyToQuery', () => {
            it('should correctly generate query date from propertyToQuery', () => {
                expect(propertyToQuery('property')).toEqual({
                    AND: [{
                        address_contains_i: 'property',
                    }],
                })
            })

            it('should not correctly generate query date from propertyToQuery', () => {
                expect(propertyToQuery()).toBeUndefined()
            })
        })

        describe('executorToQuery', () => {
            it('should correctly generate query date from executorToQuery', () => {
                expect(executorToQuery('executor')).toEqual({
                    AND: [{
                        name_contains_i: 'executor',
                    }],
                })
            })

            it('should not correctly generate query date from executorToQuery', () => {
                expect(executorToQuery()).toBeUndefined()
            })
        })

        describe('assigneeToQuery', () => {
            it('should correctly generate query date from assigneeToQuery', () => {
                expect(assigneeToQuery('assignee')).toEqual({
                    AND: [{
                        name_contains_i: 'assignee',
                    }],
                })
            })

            it('should not correctly generate query date from assigneeToQuery', () => {
                expect(assigneeToQuery()).toBeUndefined()
            })
        })

        describe('filtersToQuery', () => {
            describe('it should correctly generate query if', () => {
                it('all filters is defined', () => {
                    const currentDate = moment(new Date())
                    const status = ['1', '2']
                    const assignee = 'assignee'
                    const clientName = 'clientName'
                    const details = 'details'
                    const executor = 'executor'
                    const number = 12
                    const property = 'property'
                    const search = 'search'

                    expect(filtersToQuery({
                        status,
                        assignee,
                        clientName,
                        createdAt: currentDate.toISOString(),
                        details,
                        executor,
                        number,
                        property,
                        search,
                    })).toStrictEqual({
                        AND: [
                            {
                                status: {
                                    AND: [{
                                        id_in: status,
                                    }],
                                },
                            },
                            { clientName_contains_i: clientName },
                            { createdAt_gte: currentDate.startOf('day').toISOString() },
                            { createdAt_lte: currentDate.endOf('day').toISOString() },
                            { details_contains_i: details },
                            { executor: { AND: [{ name_contains_i: 'executor' }] } },
                            { assignee: { AND: [{ name_contains_i: 'assignee' }] } },
                            { number: number },
                            { property: { AND: [{ address_contains_i: 'property' }] } },
                            { OR: [
                                { clientName_contains_i: 'search' },
                                { details_contains_i: 'search' },
                                { executor: { AND: [{ name_contains_i: 'search' }] } },
                                { assignee: { AND: [{ name_contains_i: 'search' }] } },
                                { property: { AND: [{ address_contains_i: 'search' }] } },
                            ] },
                        ],
                    })
                })

                describe('only filter', () => {
                    it('currentDate is defined', () => {
                        const currentDate = moment(new Date())

                        expect(filtersToQuery({ createdAt: currentDate.toISOString() })).toStrictEqual({
                            AND: [
                                { createdAt_gte: currentDate.startOf('day').toISOString() },
                                { createdAt_lte: currentDate.endOf('day').toISOString() },
                            ],
                        })
                    })

                    it('status is defined', () => {
                        const status = ['1', '2']

                        expect(filtersToQuery({ status })).toStrictEqual({
                            AND: [
                                {
                                    status: {
                                        AND: [{
                                            id_in: status,
                                        }],
                                    },
                                },
                            ],
                        })
                    })

                    it('assignee is defined', () => {
                        const assignee = 'assignee'

                        expect(filtersToQuery({ assignee })).toStrictEqual({
                            AND: [
                                { assignee: { AND: [{ name_contains_i: 'assignee' }] } },
                            ],
                        })
                    })

                    it('clientName is defined', () => {
                        const clientName = 'clientName'

                        expect(filtersToQuery({ clientName })).toStrictEqual({
                            AND: [
                                { clientName_contains_i: clientName },
                            ],
                        })
                    })

                    it('details is defined', () => {
                        const details = 'details'

                        expect(filtersToQuery({ details })).toStrictEqual({
                            AND: [
                                { details_contains_i: details },
                            ],
                        })
                    })

                    it('executor is defined', () => {
                        const executor = 'executor'

                        expect(filtersToQuery({ executor })).toStrictEqual({
                            AND: [
                                { executor: { AND: [{ name_contains_i: 'executor' }] } },
                            ],
                        })
                    })

                    it('number is defined', () => {
                        const number = 12

                        expect(filtersToQuery({ number })).toStrictEqual({
                            AND: [
                                { number: number },
                            ],
                        })
                    })

                    it('property is defined', () => {
                        const property = 'property'

                        expect(filtersToQuery({ property })).toStrictEqual({
                            AND: [
                                { property: { AND: [{ address_contains_i: 'property' }] } },
                            ],
                        })
                    })

                    it('search is defined', () => {
                        const search = 'search'

                        expect(filtersToQuery({ search })).toStrictEqual({
                            AND: [
                                { OR: [
                                    { clientName_contains_i: 'search' },
                                    { details_contains_i: 'search' },
                                    { executor: { AND: [{ name_contains_i: 'search' }] } },
                                    { assignee: { AND: [{ name_contains_i: 'search' }] } },
                                    { property: { AND: [{ address_contains_i: 'search' }] } },
                                ] },
                            ],
                        })
                    })
                })
            })

            it('should not generate query if empty filters is provided', () => {
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
                    { columnKey: 'number', order: 'ascend' },
                    { columnKey: 'details', order: 'descend' },
                ])

                expect(createSorterMap(sorterQuery)).toStrictEqual({
                    number: 'ascend',
                    details: 'descend',
                })
            })

            describe('should correctly drop invalid sorter from query', () => {
                it('if columnKey is invalid', () => {
                    const sorterQuery = sorterToQuery([
                        { columnKey: 'number', order: 'ascend' },
                        { columnKey: 'details', order: 'descend' },
                        { columnKey: 'invalid', order: 'descend' },
                    ])

                    expect(createSorterMap(sorterQuery)).toStrictEqual({
                        number: 'ascend',
                        details: 'descend',
                    })
                })

                it('if order is invalid', () => {
                    const sorterQuery = sorterToQuery([
                        { columnKey: 'number', order: 'ascend' },
                        // @ts-ignore
                        { columnKey: 'details', order: 'invalid' },
                    ])

                    expect(createSorterMap(sorterQuery)).toStrictEqual({
                        number: 'ascend',
                    })
                })
            })
        })

        describe('query to sorter', () => {
            it('should return correct sorter based sort object if query includes valid column and sort key', () => {
                expect(queryToSorter(['details_ASC'])).toStrictEqual([{ columnKey: 'details', order: 'ascend' }])
            })

            describe('should not return correct sorter', () => {
                it('if column is invalid', () => {
                    expect(queryToSorter(['reandom_ASC'])).toStrictEqual([])
                })

                it('if sort key is invalid', () => {
                    expect(queryToSorter(['details_ASCC'])).toStrictEqual([])
                })

                it('if there is no sort column', () => {
                    expect(queryToSorter(['_ASCC'])).toStrictEqual([])
                })

                it('if there is no sort key', () => {
                    expect(queryToSorter(['details_'])).toStrictEqual([])
                })

                it('if there is no sort string', () => {
                    expect(queryToSorter([' '])).toStrictEqual([])
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
