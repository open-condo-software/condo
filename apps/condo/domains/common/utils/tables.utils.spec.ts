import dayjs from 'dayjs'

import {
    SorterColumn,
    ColumnInfo,
    getFilter,
    getStringContainsFilter,
    getNumberFilter,
    getStringOptionFilter,
    getDayGteFilter,
    getDayLteFilter,
    getBooleanFilter,
    getSortersFromQuery,
    convertSortersToSortBy,
    getFiltersFromQuery,
    getPageIndexFromOffset,
    getSorterMap,
    convertColumns,
} from './tables.utils'

function randInt (maxValue) {
    return Math.floor(Math.random() * maxValue)
}

describe('Table utils', () => {
    const field = 'field'
    const subfield = 'subfield'
    const target = 'target'
    const suffix = 'suffix'
    const search = 'search'
    const numberSearch = '12345'
    const dateSearch = new Date(Date.now()).toISOString()
    const nestedPath = [field, subfield, target]
    const descShortSort = 'col1_DESC'
    const ascShortSort = 'col2_ASC'
    describe('getFilter', () => {
        describe('generated filter', () => {
            describe('should return undefined', () => {
                it('if no dataIndex specified', () => {
                    expect(getFilter([], 'single', 'string', suffix)(search)).toBeUndefined()
                    expect(getFilter(undefined, 'single', 'string', suffix)(search)).toBeUndefined()
                })
                describe('requested single argument', () => {
                    it('but got multiple', () => {
                        expect(getFilter(target, 'single', 'string', suffix)(['1', '2'])).toBeUndefined()
                    })
                    it('and value is not specified', () => {
                        const filter = getFilter(target, 'single', 'string', suffix)
                        expect(filter(undefined)).toBeUndefined()
                        expect(filter(null)).toBeUndefined()
                        expect(filter('')).toBeUndefined()
                    })
                    describe('if value is not able to cast query string to type', () => {
                        it('number', () => {
                            expect(getFilter(target, 'single', 'number', suffix)(search)).toBeUndefined()
                        })
                        it('dateTime', () => {
                            expect(getFilter(target, 'single', 'dateTime', suffix)(search)).toBeUndefined()
                        })
                        it('boolean', () => {
                            expect(getFilter(target, 'single', 'boolean', suffix)(search)).toBeUndefined()
                        })
                    })
                })
                describe('requested multiple arguments', () => {
                    describe('and no correct values specified', () => {
                        it('for date', () => {
                            expect(getFilter(target, 'array', 'dateTime', suffix)(['a', 'b', 'c'])).toBeUndefined()
                        })
                        it('for numbers', () => {
                            expect(getFilter(target, 'array', 'number', suffix)(['a', 'b', 'c'])).toBeUndefined()
                        })
                        it('for strings', () => {
                            expect(getFilter(target, 'array', 'string', suffix)([null, ''])).toBeUndefined()
                        })
                        it('for booleans', () => {
                            expect(getFilter(target, 'array', 'boolean', suffix)(['a', 'b', 'c'])).toBeUndefined()
                        })
                    })
                })
            })
            describe('should return correct where query', () => {
                describe('if dataIndex is', () => {
                    it('string', () => {
                        const propertyName = `${target}_${suffix}`
                        const expectedResult = { [propertyName]: search }
                        const flatFilter = getFilter(target, 'single', 'string', suffix)
                        expect(flatFilter(search)).toStrictEqual(expectedResult)
                    })
                    it('array of strings', () => {
                        const propertyName = `${target}_${suffix}`
                        const expectedResult = { [field]: { [subfield]: { [propertyName]: search } } }
                        const nestedFilter = getFilter(nestedPath, 'single', 'string', suffix)
                        expect(nestedFilter(search)).toStrictEqual(expectedResult)
                    })
                })
                describe('if suffix is', () => {
                    it('specified', () => {
                        const flatFilter = getFilter(target, 'single', 'string', suffix)
                        const nestedFilter = getFilter(nestedPath, 'single', 'string', suffix)
                        const propertyName = `${target}_${suffix}`
                        const expectedFlatResult = { [propertyName]: search }
                        const expectedNestedResult = { [field]: { [subfield]: { [propertyName]: search } } }
                        expect(flatFilter(search)).toStrictEqual(expectedFlatResult)
                        expect(nestedFilter(search)).toStrictEqual(expectedNestedResult)
                    })
                    it('not specified', () => {
                        const flatFilter = getFilter(target, 'single', 'string', undefined)
                        const emptySuffixFlatFilter = getFilter(target, 'single', 'string', '')
                        const nestedFilter = getFilter(nestedPath, 'single', 'string', null)
                        const expectedFlatResult = { [target]: search }
                        const expectedNestedResult = { [field]: { [subfield]: { [target]: search } } }
                        expect(flatFilter(search)).toStrictEqual(expectedFlatResult)
                        expect(emptySuffixFlatFilter(search)).toStrictEqual(expectedFlatResult)
                        expect(nestedFilter(search)).toStrictEqual(expectedNestedResult)
                    })
                })
                describe('if requested single argument', () => {
                    it('valid string', () => {
                        const filter = getFilter(target, 'single', 'string', undefined)
                        expect(filter(search)).toStrictEqual({ [target]: search })
                    })
                    it('valid number', () => {
                        const filter = getFilter(target, 'single', 'number', undefined)
                        expect(filter(numberSearch)).toStrictEqual({ [target]: Number(numberSearch) })
                    })
                    it('valid date', () => {
                        const filter = getFilter(target, 'single', 'dateTime', undefined)
                        expect(filter(dateSearch)).toStrictEqual({ [target]: dateSearch })
                    })
                    it('valid boolean', () => {
                        const filter = getFilter(target, 'single', 'boolean', undefined)
                        expect(filter('true')).toStrictEqual({ [target]: true })
                        expect(filter('false')).toStrictEqual({ [target]: false })
                        expect(filter('tRuE')).toStrictEqual({ [target]: true })
                        expect(filter('fALSe')).toStrictEqual({ [target]: false })
                    })
                })
                describe('if requested multiple arguments', () => {
                    it('strings', () => {
                        const filter = getFilter(target, 'array', 'string', suffix)
                        const expectedResult = { [`${target}_${suffix}`]: [search, numberSearch] }
                        expect(filter([search, numberSearch])).toStrictEqual(expectedResult)
                    })
                    it('numbers', () => {
                        const filter = getFilter(target, 'array', 'number', suffix)
                        const additionalNumber = '123'
                        const expectedResult = {
                            [`${target}_${suffix}`]: [
                                Number(numberSearch),
                                Number(additionalNumber),
                            ],
                        }
                        expect(filter([numberSearch, additionalNumber])).toStrictEqual(expectedResult)
                    })
                    it('dateTimes', () => {
                        const filter = getFilter(target, 'array', 'dateTime', suffix)
                        const additionalDate = new Date(Date.now()).toISOString()
                        const expectedResult = {
                            [`${target}_${suffix}`]: [
                                dateSearch,
                                additionalDate,
                            ],
                        }
                        expect(filter([dateSearch, additionalDate])).toStrictEqual(expectedResult)
                    })
                    it('booleans', () => {
                        const filter = getFilter(target, 'array', 'boolean', suffix)
                        const expectedResult = {
                            [`${target}_${suffix}`]: [
                                true,
                                false,
                            ],
                        }
                        expect(filter(['tRUE', 'fAlSe'])).toStrictEqual(expectedResult)
                    })
                })
            })
            it('should drop incorrect values from list of arguments', () => {
                const filter = getFilter(target, 'array', 'number', suffix)
                const expectedResult = {
                    [`${target}_${suffix}`]: [Number(numberSearch)],
                }
                expect(filter([numberSearch, search])).toStrictEqual(expectedResult)
            })
            it('should convert single argument to list if multiple requested', () => {
                const filter = getFilter(target, 'array', 'string', suffix)
                const expectedResult = { [`${target}_${suffix}`]: [search] }
                expect(filter(search)).toStrictEqual(expectedResult)
            })
        })
    })
    describe('getStringContainsFilter', () => {
        const filter = getStringContainsFilter(field)
        it('should have "contains_i" suffix', () => {
            const result = filter(search)
            expect(result).toHaveProperty(`${field}_contains_i`, search)
        })
        it('should accept only single argument', () => {
            const result = filter([search, numberSearch])
            expect(result).toBeUndefined()
        })
    })
    describe('getStringOptionFilter', () => {
        const filter = getStringOptionFilter(field)
        it('should have "in" suffix', () => {
            const result = filter(search)
            expect(result).toHaveProperty(`${field}_in`, [search])
        })
        it('should work with multiple parameters', () => {
            const result = filter([search, numberSearch])
            expect(result).toHaveProperty(`${field}_in`, [search, numberSearch])
        })
    })
    describe('getNumberFilter', () => {
        const filter = getNumberFilter(field)
        it('should have no suffix', () => {
            const result = filter(numberSearch)
            expect(result).toHaveProperty(field, Number(numberSearch))
        })
        it('should be undefined if value is not number', () => {
            const result = filter(search)
            expect(result).toBeUndefined()
        })
        it('should accept only single argument', () => {
            const result = filter([search, numberSearch])
            expect(result).toBeUndefined()
        })
    })
    describe('getDayGteFilter', () => {
        const filter = getDayGteFilter(field)
        const propertyName = `${field}_gte`
        it('should have "gte" suffix', () => {
            expect(filter(dateSearch)).toHaveProperty(propertyName)
        })
        it('should accept only single argument', () => {
            const result = filter([dateSearch, numberSearch])
            expect(result).toBeUndefined()
        })
        it('should be undefined if value is not valid date', () => {
            const result = filter(search)
            expect(result).toBeUndefined()
        })
        it('should parse start of the day correctly', () => {
            const startOfDay = dayjs(dateSearch).startOf('day').toISOString()
            const expectedResult = { [propertyName]: startOfDay }
            expect(filter(dateSearch)).toStrictEqual(expectedResult)
        })
    })
    describe('getDayLteFilter', () => {
        const filter = getDayLteFilter(field)
        const propertyName = `${field}_lte`
        it('should have "lte" suffix', () => {
            expect(filter(dateSearch)).toHaveProperty(propertyName)
        })
        it('should accept only single argument', () => {
            const result = filter([dateSearch, numberSearch])
            expect(result).toBeUndefined()
        })
        it('should be undefined if value is not valid date', () => {
            const result = filter(search)
            expect(result).toBeUndefined()
        })
        it('should parse end of the day correctly', () => {
            const startOfDay = dayjs(dateSearch).endOf('day').toISOString()
            const expectedResult = { [propertyName]: startOfDay }
            expect(filter(dateSearch)).toStrictEqual(expectedResult)
        })
    })
    describe('getBooleanFilter', () => {
        const filter = getBooleanFilter(field)
        it('should have no suffix', () => {
            const result = filter('true')
            expect(result).toHaveProperty(field, true)
        })
        it('should be undefined if value is not a boolean string', () => {
            const result = filter(search)
            expect(result).toBeUndefined()
        })
        it('should accept only single argument', () => {
            const result = filter(['true', 'false'])
            expect(result).toBeUndefined()
        })
    })
    describe('getSortersFromQuery', () => {
        describe('should return empty list', () => {
            it('if "sort" attribute is not specified', () => {
                expect(getSortersFromQuery({})).toStrictEqual([])
            })
        })
        describe('should return list of sorters', () => {
            const expectedMultipleResult = [
                { columnKey: 'col2', order: 'ascend' },
                { columnKey: 'col1', order: 'descend' },
            ]
            it('if "sort" passed as list of strings', () => {
                expect(getSortersFromQuery({ sort: [ascShortSort, descShortSort] })).toStrictEqual(expectedMultipleResult)
            })
            it('if "sort" passed as single string', () => {
                expect(getSortersFromQuery({ sort: `${ascShortSort},${descShortSort}` })).toStrictEqual(expectedMultipleResult)
            })
        })
        describe('should drop invalid columns and orders', () => {
            const expected = { columnKey: 'col1', order: 'descend' }
            it('if it\'s not possible to split it by "_"', () => {
                const sort = [descShortSort, 'col1ASD']
                expect(getSortersFromQuery({ sort })).toStrictEqual([expected])
            })
            it('if no column or correct order specified', () => {
                const brokenOrderSort = [descShortSort, 'col1_bla']
                const noColumnSort = [descShortSort, '_bla']
                expect(getSortersFromQuery({ sort: brokenOrderSort })).toStrictEqual([expected])
                expect(getSortersFromQuery({ sort: noColumnSort })).toStrictEqual([expected])
            })
        })
    })
    describe('convertSortersToSortBy', () => {
        it('should return empty list if no sorters provided', () => {
            expect(convertSortersToSortBy()).toStrictEqual([])
        })
        it('should return sortBy strings', () => {
            const sorters: Array<SorterColumn> = [
                { columnKey: 'col2', order: 'ascend' },
                { columnKey: 'col1', order: 'descend' },
            ]
            const expectedResult = [
                ascShortSort,
                descShortSort,
            ]
            expect(convertSortersToSortBy(sorters)).toStrictEqual(expectedResult)
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
            it('if some arguments are invalid strings', () => {
                expect(getFiltersFromQuery({ filters: '{"key": true, "key2": ["value", 2]}' })).toStrictEqual({
                    key2: ['value'],
                })
            })
            it('if invalid JSON is provided', () => {
                expect(getFiltersFromQuery({ filters: '{"key": value, "key2": value}' })).toStrictEqual({})
            })
        })
    })
    describe('getPageIndexFromOffset', () => {
        const attempts = 10
        const pageSize = 10
        it('rounded value test', () => {
            for (let i = 0; i < attempts; i++) {
                const page = randInt(1000)
                expect(getPageIndexFromOffset(page * pageSize, pageSize)).toStrictEqual(page + 1)
            }
        })
        it('not-rounded value test', () => {
            for (let i = 0; i < attempts; i++) {
                const offset  = i * pageSize + randInt(pageSize)
                expect(getPageIndexFromOffset(offset, pageSize)).toStrictEqual(i + 1)
            }
        })
    })
    describe('getSorterMap', () => {
        it('should convert array of sorters to single object', () => {
            const sorters: Array<SorterColumn> = [
                { columnKey: 'a', order: 'ascend' },
                { columnKey: 'b', order: 'descend' },
                { columnKey: 'c', order: 'descend' },
                { columnKey: 'd', order: 'ascend' },
            ]
            const sorterMap = getSorterMap(sorters)
            sorters.forEach((sorter) => {
                expect(sorterMap).toHaveProperty(sorter.columnKey, sorter.order)
            })
        })
    })
    describe('convertColumns', () => {
        const column: ColumnInfo<string> = {
            title: 'title',
            key: 'key',
            width: 100,
            dataIndex: ['field', 'subfield'],
        }
        it('should create basic antd column', () => {
            const antdColumns = convertColumns([column], {}, {})
            expect(antdColumns).toHaveLength(1)
            const antdColumn = antdColumns[0]
            expect(antdColumn).toHaveProperty('title', column.title)
            expect(antdColumn).toHaveProperty('key', column.key)
            expect(antdColumn).toHaveProperty('dataIndex', column.dataIndex)
            expect(antdColumn).toHaveProperty('width', '100%')
        })
        it('should set responsive for depending on visibility', () => {
            const col1 = { ...column }
            const col2 = { ...column, key: 'key2', visible: false }
            const antdColumns = convertColumns([col1, col2], {}, {})
            expect(antdColumns).toHaveLength(2)
            expect(antdColumns[0].responsive).toBeUndefined()
            expect(antdColumns[1].responsive).toStrictEqual([])
        })
        describe('should recalculate sizes proportionately for visible columns', () => {
            const col1 = { ...column }
            const col2 = { ...column, key: 'key2', visible: false }
            const col3 = { ...column, key: 'key3' }
            const col4 = { ...column, key: 'key4', grow: 0 }
            it('if no grow specified', () => {
                const antdColumns = convertColumns([col1, col2, col3], {}, {})
                expect(antdColumns).toHaveLength(3)
                expect(antdColumns[0].width).toStrictEqual('50%')
                expect(antdColumns[2].width).toStrictEqual('50%')
            })
            it('if some column has grow = 0', () => {
                const antdColumns = convertColumns([col1, col2, col3, col4], {}, {})
                expect(antdColumns).toHaveLength(4)
                expect(antdColumns[0].width).toStrictEqual('37.5%')
                expect(antdColumns[2].width).toStrictEqual('37.5%')
                expect(antdColumns[3].width).toStrictEqual('25%')
            })
            it('if columns have custom grow', () => {
                const newCol1 = { ...col1, grow: 4 }
                const antdColumns = convertColumns([newCol1, col2, col3, col4], {}, {})
                expect(antdColumns).toHaveLength(4)
                expect(antdColumns[0].width).toStrictEqual('45%')
                expect(antdColumns[2].width).toStrictEqual('30%')
                expect(antdColumns[3].width).toStrictEqual('25%')
            })

        })
        it('should be sortable, if it\'s specified', () => {
            const col1 = { ...column }
            const col2 = { ...column, key: 'key2', sortable: true }
            const col3 = { ...column, key: 'key3', sortable: true }
            const col4 = { ...column, key: 'key4', sortable: true }
            const antdColumns = convertColumns([col1, col2, col3, col4], {}, { 'key3': 'ascend', 'key2': 'descend' })
            expect(antdColumns).toHaveLength(4)
            expect(antdColumns[0]).toHaveProperty('sorter', false)
            expect(antdColumns[1]).toHaveProperty('sorter', true)
            expect(antdColumns[1]).toHaveProperty('sortOrder', 'descend')
            expect(antdColumns[2]).toHaveProperty('sorter', true)
            expect(antdColumns[2]).toHaveProperty('sortOrder', 'ascend')
            expect(antdColumns[3]).toHaveProperty('sorter', true)
            expect(antdColumns[3]).toHaveProperty('sortOrder', undefined)
        })
        it('should work with custom render', () => {
            const customRender = (text) => `${text}_${text}`
            const customColumn = { ...column, render: customRender }
            const antdColumns = convertColumns([customColumn], {}, {})
            expect(antdColumns).toHaveLength(1)
            expect(antdColumns[0]).toHaveProperty('render', customRender)
        })
        it('should detect filter value', () => {
            const col1 = column
            const col2 = { ...column, key: 'key2' }
            const antdColumns = convertColumns([col1, col2], { key: 'value' }, {})
            expect(antdColumns).toHaveLength(2)
            expect(antdColumns[0]).toHaveProperty('filteredValue', 'value')
            expect(antdColumns[1]).toHaveProperty('filteredValue', null)
        })
        it('should create filterDropdowns for typed filters', () => {
            const col1: ColumnInfo<string> = { ...column, filter: { type: 'string' } }
            const col2: ColumnInfo<string> = { ...column, key: 'key2', filter: { type: 'stringOption', options: [{ label: 'label', value: '0' }] } }
            const col3: ColumnInfo<string> = { ...column, key: 'key2', filter: { type: 'date' } }
            const antdColumns = convertColumns([col1, col2, col3], {}, {})
            expect(antdColumns).toHaveLength(3)
            expect(antdColumns[0]).toHaveProperty('filterDropdown')
            expect(antdColumns[0].filterDropdown).toBeDefined()
            expect(antdColumns[1]).toHaveProperty('filterDropdown')
            expect(antdColumns[1].filterDropdown).toBeDefined()
            expect(antdColumns[2]).toHaveProperty('filterDropdown')
            expect(antdColumns[2].filterDropdown).toBeDefined()
        })
        it('should create default render for string-filtered columns', () => {
            const col1: ColumnInfo<string> = { ...column }
            const col2: ColumnInfo<string> = { ...column, key: 'key2', filter: { type: 'string' } }
            const antdColumns = convertColumns([col1, col2], {}, {})
            expect(antdColumns).toHaveLength(2)
            expect(antdColumns[0]).toHaveProperty('render')
            expect(antdColumns[0].render).toBeUndefined()
            expect(antdColumns[1]).toHaveProperty('render')
            expect(antdColumns[1].render).toBeDefined()
        })
    })
})