import { omitRecursively } from './omitRecursively'

describe('omitRecursively', () => {
    it('omits provided property from object', () => {
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