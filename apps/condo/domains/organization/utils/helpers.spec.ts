import {
    filtersToQuery,
    sorterToQuery,
    createSorterMap,
    getSortStringFromQuery,
    getPageIndexFromQuery,
    queryToSorter,
    searchToQuery,
} from './helpers'

describe('Helpers', () => {
    describe('queryUtils', () => {
        describe('filtersToQuery', () => {
            describe('it should correctly generate query if', () => {
                it('all filters is defined', () => {
                    const name = 'name'
                    const phone = 'phone'
                    const email = 'email'
                    const role = ['role1', 'role2']
                    const search = 'search'
                    const position = 'position'

                    expect(
                        filtersToQuery({
                            name,
                            phone,
                            email,
                            role,
                            search,
                            position,
                        }),
                    ).toStrictEqual({
                        AND: [
                            { name_contains_i: name },
                            { phone_contains_i: phone },
                            { email_contains_i: email },
                            {
                                role: {
                                    AND: [
                                        {
                                            id_in: role,
                                        },
                                    ],
                                },
                            },
                            { position_contains_i: position },
                            {
                                OR: [
                                    { name_contains_i: search },
                                    { phone_contains_i: search },
                                    { email_contains_i: search },
                                    {
                                        role: {
                                            AND: [
                                                {
                                                    name_contains_i: search,
                                                },
                                            ],
                                        },
                                    },
                                    { position_contains_i: search },
                                ],
                            },
                        ],
                    })
                })

                describe('only filter', () => {
                    it('name is defined', () => {
                        const name = 'name'

                        expect(filtersToQuery({ name })).toStrictEqual({
                            AND: [{ name_contains_i: name }],
                        })
                    })

                    it('phone is defined', () => {
                        const phone = 'phone'

                        expect(filtersToQuery({ phone })).toStrictEqual({
                            AND: [{ phone_contains_i: phone }],
                        })
                    })

                    it('email is defined', () => {
                        const email = 'email'

                        expect(filtersToQuery({ email })).toStrictEqual({
                            AND: [{ email_contains_i: email }],
                        })
                    })

                    it('roles is defined', () => {
                        const role = ['role1', 'role2']

                        expect(filtersToQuery({ role })).toStrictEqual({
                            AND: [
                                {
                                    role: {
                                        AND: [
                                            {
                                                id_in: role,
                                            },
                                        ],
                                    },
                                },
                            ],
                        })
                    })

                    it('search is defined', () => {
                        const search = 'search'

                        expect(filtersToQuery({ search })).toStrictEqual({
                            AND: [
                                {
                                    OR: [
                                        { name_contains_i: search },
                                        { phone_contains_i: search },
                                        { email_contains_i: search },
                                        {
                                            role: {
                                                AND: [
                                                    {
                                                        name_contains_i: search,
                                                    },
                                                ],
                                            },
                                        },
                                        { position_contains_i: search },
                                    ],
                                },
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
                    expect(
                        sorterToQuery([
                            { columnKey: 'column1', order: 'ascend' },
                            { columnKey: 'column2', order: 'descend' },
                        ]),
                    ).toStrictEqual(['column1_ASC', 'column2_DESC'])
                })

                it('if sorter is Single object', () => {
                    expect(
                        sorterToQuery({
                            columnKey: 'column1',
                            order: 'ascend',
                        }),
                    ).toStrictEqual(['column1_ASC'])
                })
            })

            it('should drop sort if order is invalid', () => {
                expect(
                    sorterToQuery([
                        { columnKey: 'column1', order: 'ascend' },
                        // @ts-ignore
                        { columnKey: 'column2', order: 'invalid_descend' },
                    ]),
                ).toStrictEqual(['column1_ASC'])
            })

            it('should not generate query if no sort is provided', () => {
                expect(sorterToQuery()).toStrictEqual([])
            })
        })

        describe('createSorterMap', () => {
            it('should correctly create sorter map from query', () => {
                const sorterQuery = sorterToQuery([
                    { columnKey: 'name', order: 'ascend' },
                    { columnKey: 'phone', order: 'descend' },
                ])

                expect(createSorterMap(sorterQuery)).toStrictEqual({
                    name: 'ascend',
                    phone: 'descend',
                })
            })

            describe('should correctly drop invalid sorter from query', () => {
                it('if columnKey is invalid', () => {
                    const sorterQuery = sorterToQuery([
                        { columnKey: 'name', order: 'ascend' },
                        { columnKey: 'phone', order: 'descend' },
                        { columnKey: 'invalid', order: 'descend' },
                    ])

                    expect(createSorterMap(sorterQuery)).toStrictEqual({
                        name: 'ascend',
                        phone: 'descend',
                    })
                })

                it('if order is invalid', () => {
                    const sorterQuery = sorterToQuery([
                        { columnKey: 'name', order: 'ascend' },
                        // @ts-ignore
                        { columnKey: 'phone', order: 'invalid' },
                    ])

                    expect(createSorterMap(sorterQuery)).toStrictEqual({
                        name: 'ascend',
                    })
                })
            })
        })

        describe('query to sorter', () => {
            it('should return correct sorter based sort object if query includes valid column and sort key', () => {
                expect(queryToSorter(['name_ASC'])).toStrictEqual([{ columnKey: 'name', order: 'ascend' }])
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
                it('search is a string', () => {
                    const search = 'search'

                    expect(searchToQuery(search)).toStrictEqual([
                        { name_contains_i: search },
                        { phone_contains_i: search },
                        { email_contains_i: search },
                        {
                            role: {
                                AND: [
                                    {
                                        name_contains_i: search,
                                    },
                                ],
                            },
                        },
                        { position_contains_i: search },
                    ])
                })

                it('search is string that can be converted to a number', () => {
                    const search = '10'

                    expect(searchToQuery(search)).toStrictEqual([
                        { name_contains_i: search },
                        { phone_contains_i: search },
                        { email_contains_i: search },
                        {
                            role: {
                                AND: [
                                    {
                                        name_contains_i: search,
                                    },
                                ],
                            },
                        },
                        { position_contains_i: search },
                    ])
                })

                it('search is not defined', () => {
                    expect(searchToQuery()).toBeUndefined()
                })
            })
        })
    })
})
