import moment from 'moment'
import {
    statusToQuery,
    createdAtToQuery,
    filtersToQuery,
    sorterToQuery,
    createSorterMap,
    getSortStringFromQuery,
    getPaginationFromQuery,
    getFiltersFromQuery,
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

                    expect(filtersToQuery({
                        status,
                        assignee,
                        clientName,
                        createdAt: currentDate.toISOString(),
                        details,
                        executor,
                        number,
                        property,
                    })).toStrictEqual({
                        AND: [
                            {
                                status: {
                                    AND: [{
                                        id_in: status,
                                    }],
                                },
                            },
                            { assignee_contains: assignee },
                            { clientName_contains: clientName },
                            { createdAt_gte: currentDate.startOf('day').toISOString() },
                            { createdAt_lte: currentDate.endOf('day').toISOString() },
                            { details_contains: details },
                            { executor_contains: executor },
                            { number: number },
                            { property_contains: property },
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
                                { assignee_contains: assignee },
                            ],
                        })
                    })

                    it('clientName is defined', () => {
                        const clientName = 'clientName'

                        expect(filtersToQuery({ clientName })).toStrictEqual({
                            AND: [
                                { clientName_contains: clientName },
                            ],
                        })
                    })

                    it('details is defined', () => {
                        const details = 'details'

                        expect(filtersToQuery({ details })).toStrictEqual({
                            AND: [
                                { details_contains: details },
                            ],
                        })
                    })

                    it('all filters is defined', () => {
                        const executor = 'executor'

                        expect(filtersToQuery({ executor })).toStrictEqual({
                            AND: [
                                { executor_contains: executor },
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
                                { property_contains: property },
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