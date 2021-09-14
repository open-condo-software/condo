const { omitRecursively } = require('./cleaner')

describe('cleaner utils', () => {
    describe('omitRecursively', () => {
        const firstProperty = 'first'
        const secondProperty = 'second'
        const thirdProperty = 'third'
        const brokenProperty = 'broken'
        const obj = { firstProperty, secondProperty, thirdProperty }
        const smallObj = { firstProperty, secondProperty }
        const brokenObj = { ...obj, [brokenProperty]: brokenProperty }
        describe('should remove property', () => {
            it('from object', () => {
                expect(omitRecursively(brokenObj, brokenProperty)).toStrictEqual(obj)
            })
            it('from list of objects', () => {

                const objs = [smallObj, brokenObj]
                expect(omitRecursively(objs, brokenProperty)).toStrictEqual([smallObj, obj])
            })
            it('from nested object', () => {
                const nestedObj = { ...smallObj, nested: brokenObj }
                const expectedResult = { ...smallObj, nested: obj }
                expect(omitRecursively(nestedObj, brokenProperty)).toStrictEqual(expectedResult)
            })
            it('from nested list', () => {
                const thirdObj = { a: '213' }
                const nestedObj = { ...smallObj, nested: [thirdObj, brokenObj] }
                const expectedResult = { ...smallObj, nested: [thirdObj, obj] }
                expect(omitRecursively(nestedObj, brokenProperty)).toStrictEqual(expectedResult)
            })
            describe('from complex structures', () => {
                it('all cases combined', () => {
                    const beforeObj = { prop: true, list: [{ a: 1, [brokenProperty]: 'bla' }, { b: 2 }, { c: 3, [brokenProperty]: 'a', d: { [brokenProperty]: 'nested bla' } }] }
                    const expectedResult = { prop: true, list: [{ a: 1 }, { b: 2 }, { c: 3, d: {} }] }
                    expect(omitRecursively(beforeObj, brokenProperty)).toStrictEqual(expectedResult)
                })
                it('property fields', () => {
                    const obj = {
                        '__typename': 'BuildingMap',
                        'dv': 1,
                        'type': 'building',
                        'sections': [
                            {
                                '__typename': 'BuildingSection',
                                'id': '1',
                                'type': 'section',
                                'index': 0,
                                'name': '1',
                                'preview': null,
                                'floors': [
                                    {
                                        '__typename': 'BuildingFloor',
                                        'id': '2',
                                        'type': 'floor',
                                        'index': 2,
                                        'name': '2',
                                        'units': [
                                            {
                                                '__typename': 'BuildingUnit',
                                                'id': '3',
                                                'type': 'unit',
                                                'name': null,
                                                'label': '3',
                                                'preview': null,
                                            },
                                            {
                                                '__typename': 'BuildingUnit',
                                                'id': '4',
                                                'type': 'unit',
                                                'name': null,
                                                'label': '4',
                                                'preview': null,
                                            },
                                        ],
                                    },
                                    {
                                        '__typename': 'BuildingFloor',
                                        'id': '5',
                                        'type': 'floor',
                                        'index': 1,
                                        'name': '1',
                                        'units': [
                                            {
                                                '__typename': 'BuildingUnit',
                                                'id': '6',
                                                'type': 'unit',
                                                'name': null,
                                                'label': '1',
                                                'preview': null,
                                            },
                                            {
                                                '__typename': 'BuildingUnit',
                                                'id': '7',
                                                'type': 'unit',
                                                'name': null,
                                                'label': '2',
                                                'preview': null,
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                'id': '16',
                                'floors': [
                                    {
                                        'id': '22',
                                        'index': 2,
                                        'name': '2',
                                        'type': 'floor',
                                        'units': [
                                            {
                                                'id': '20',
                                                'label': '7',
                                                'type': 'unit',
                                            },
                                            {
                                                'id': '21',
                                                'label': '8',
                                                'type': 'unit',
                                            },
                                        ],
                                    },
                                    {
                                        'id': '19',
                                        'index': 1,
                                        'name': '1',
                                        'type': 'floor',
                                        'units': [
                                            {
                                                'id': '17',
                                                'label': '5',
                                                'type': 'unit',
                                            },
                                            {
                                                'id': '18',
                                                'label': '6',
                                                'type': 'unit',
                                            },
                                        ],
                                    },
                                ],
                                'name': '2',
                                'index': 2,
                                'type': 'section',
                            },
                        ],
                    }
                    const objWithoutTypename = {
                        'dv': 1,
                        'type': 'building',
                        'sections': [
                            {
                                'id': '1',
                                'type': 'section',
                                'index': 0,
                                'name': '1',
                                'preview': null,
                                'floors': [
                                    {
                                        'id': '2',
                                        'type': 'floor',
                                        'index': 2,
                                        'name': '2',
                                        'units': [
                                            {
                                                'id': '3',
                                                'type': 'unit',
                                                'name': null,
                                                'label': '3',
                                                'preview': null,
                                            },
                                            {
                                                'id': '4',
                                                'type': 'unit',
                                                'name': null,
                                                'label': '4',
                                                'preview': null,
                                            },
                                        ],
                                    },
                                    {
                                        'id': '5',
                                        'type': 'floor',
                                        'index': 1,
                                        'name': '1',
                                        'units': [
                                            {
                                                'id': '6',
                                                'type': 'unit',
                                                'name': null,
                                                'label': '1',
                                                'preview': null,
                                            },
                                            {
                                                'id': '7',
                                                'type': 'unit',
                                                'name': null,
                                                'label': '2',
                                                'preview': null,
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                'id': '16',
                                'floors': [
                                    {
                                        'id': '22',
                                        'index': 2,
                                        'name': '2',
                                        'type': 'floor',
                                        'units': [
                                            {
                                                'id': '20',
                                                'label': '7',
                                                'type': 'unit',
                                            },
                                            {
                                                'id': '21',
                                                'label': '8',
                                                'type': 'unit',
                                            },
                                        ],
                                    },
                                    {
                                        'id': '19',
                                        'index': 1,
                                        'name': '1',
                                        'type': 'floor',
                                        'units': [
                                            {
                                                'id': '17',
                                                'label': '5',
                                                'type': 'unit',
                                            },
                                            {
                                                'id': '18',
                                                'label': '6',
                                                'type': 'unit',
                                            },
                                        ],
                                    },
                                ],
                                'name': '2',
                                'index': 2,
                                'type': 'section',
                            },
                        ],
                    }
                    const cleanedObj = omitRecursively(obj, '__typename')
                    expect(cleanedObj).toStrictEqual(objWithoutTypename)
                })
            })
        })
    })
})
