import { createNewBBuildingSectionData, BBuildingData, addNewBBuildingUnitToSectionData } from './BBuilder'

const ONE_SECTION_TWO_FLOORS = {
    name: 'Justice 1th',
    sections: [
        {
            id: 1,
            type: 'section',
            name: '1',
            floors: [
                {
                    id: 2,
                    type: 'floor',
                    name: '2',
                    index: 2,
                    units: [
                        { id: 3, type: 'unit', name: '22' },
                        { id: 4, type: 'unit', name: '23' },
                    ],
                },
                {
                    id: 5,
                    type: 'floor',
                    name: '1',
                    index: 1,
                    units: [
                        { id: 6, type: 'unit', name: '11' },
                    ],
                },
            ],
        },
    ],
}

const ONE_SECTION_TWO_FLOORS__FLOOR_1 = {
    id: 5,
    key: 8,
    name: '1',
    pos: [0, 1],
    sections: [
        {
            id: 1,
            key: 7,
            pos: [0],
            units: [
                { id: 6, key: 5, type: 'unit', name: '11', pos: [0, 1, 0] },
                { key: 6, type: 'empty' },
            ],
        },
    ],
}

const ONE_SECTION_TWO_FLOORS__FLOOR_2 = {
    id: 2,
    key: 4,
    name: '2',
    pos: [0, 0],
    sections: [
        {
            id: 1,
            key: 3,
            pos: [0],
            units: [
                { id: 3, key: 1, type: 'unit', name: '22', pos: [0, 0, 0] },
                { id: 4, key: 2, type: 'unit', name: '23', pos: [0, 0, 1] },
            ],
        },
    ],
}

const TWO_SECTION_THREE_FLOORS = {
    name: 'Justice 2th',
    sections: [
        {
            id: 1,
            type: 'section',
            floors: [
                {
                    id: 2,
                    type: 'floor',
                    name: '2',
                    index: 2,
                    units: [{ id: 3, type: 'unit', name: '22' }, { id: 4, type: 'unit', name: '23' }],
                },
                {
                    id: 5,
                    type: 'floor',
                    name: '1',
                    index: 1,
                    units: [{ id: 6, type: 'unit', name: '11' }],
                },
            ],
        },
        {
            id: 7,
            type: 'section',
            index: 2,
            floors: [
                {
                    id: 8,
                    type: 'floor',
                    name: '1',
                    index: 1,
                    units: [{ id: 9, type: 'unit', name: '22x' }, { id: 10, type: 'unit', name: '23x' }],
                },
                {
                    id: 11,
                    type: 'floor',
                    name: '-1',
                    index: -1,
                    units: [{ id: 12, type: 'unit', name: '11x' }, { id: 15, type: 'unit', name: '12x' }],
                },
            ],
        },
    ],
}

test('BBuilderData._getFloorIndex() 1 section', () => {
    const b = new BBuildingData(ONE_SECTION_TWO_FLOORS)
    b.uniqKey = 1
    expect(b._getFloorIndex(2)).toEqual(ONE_SECTION_TWO_FLOORS__FLOOR_2)
    expect(b._getFloorIndex(1)).toEqual(ONE_SECTION_TWO_FLOORS__FLOOR_1)
})

test('BBuilderData.getVisualMatrix() 1 section', () => {
    const b = new BBuildingData(ONE_SECTION_TWO_FLOORS)
    expect(b.getVisualMatrix()).toEqual({
        sections: [{ id: 1, key: 9, pos: [0], name: '1', size: 2 }],
        floors: [
            ONE_SECTION_TWO_FLOORS__FLOOR_2,
            ONE_SECTION_TWO_FLOORS__FLOOR_1,
        ],
    })
})

test('BBuilderData.getVisualMatrix() 2 sections', () => {
    const b = new BBuildingData(TWO_SECTION_THREE_FLOORS)
    expect(b.getVisualMatrix()).toEqual({
        sections: [{ id: 1, key: 22, pos: [0], name: '', size: 2 }, { id: 7, key: 23, pos: [1], name: '', size: 2 }],
        floors: [
            {
                id: 2,
                key: 7,
                name: '2',
                pos: [0, 0],
                sections: [
                    {
                        id: 1, key: 3, pos: [0], units: [
                            { id: 3, key: 1, type: 'unit', name: '22', pos: [0, 0, 0] },
                            { id: 4, key: 2, type: 'unit', name: '23', pos: [0, 0, 1] }],
                    },
                    {
                        id: 7, key: 6, pos: [1], units: [
                            { key: 4, type: 'empty' },
                            { key: 5, type: 'empty' }],
                    },
                ],
            },
            {
                id: 5,
                key: 14,
                name: '1',
                pos: [0, 1],
                sections: [
                    {
                        id: 1, key: 10, pos: [0], units: [
                            { id: 6, key: 8, type: 'unit', name: '11', pos: [0, 1, 0] },
                            { key: 9, type: 'empty' }],
                    },
                    {
                        id: 7, key: 13, pos: [1], units: [
                            { id: 9, key: 11, type: 'unit', name: '22x', pos: [1, 0, 0] },
                            { id: 10, key: 12, type: 'unit', name: '23x', pos: [1, 0, 1] }],
                    },
                ],
            },
            {
                id: 11,
                key: 21,
                name: '-1',
                pos: [1, 1],
                sections: [
                    {
                        id: 1, key: 17, pos: [0], units: [
                            { key: 15, type: 'empty' },
                            { key: 16, type: 'empty' }],
                    },
                    {
                        id: 7, key: 20, pos: [1], units: [
                            { id: 12, key: 18, type: 'unit', name: '11x', pos: [1, 1, 0] },
                            { id: 15, key: 19, type: 'unit', name: '12x', pos: [1, 1, 1] }],
                    },
                ],
            },
        ],
    })
})

test('createNewBBuildingSectionData(1, 2, 4)', () => {
    const r = createNewBBuildingSectionData({ sectionName: 'S1', minFloor: 1, maxFloor: 2, unitsPerFloor: 4 })
    const prefix = r.id
    expect(r).toEqual({
        id: prefix,
        type: 'section',
        name: 'S1',
        floors: [
            {
                id: `${prefix}-2`,
                type: 'floor',
                name: '2',
                index: 2,
                units: [
                    {
                        id: `${prefix}-2-1`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-2-2`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-2-3`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-2-4`,
                        type: 'unit',
                    },
                ],
            },
            {
                id: `${prefix}-1`,
                type: 'floor',
                name: '1',
                index: 1,
                units: [
                    {
                        id: `${prefix}-1-1`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-1-2`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-1-3`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-1-4`,
                        type: 'unit',
                    },
                ],
            },
        ],
    })
})

test('createNewBBuildingSectionData(-1, 1, 4)', () => {
    const r = createNewBBuildingSectionData({ sectionName: 'S1', minFloor: -1, maxFloor: 1, unitsPerFloor: 4 })
    const prefix = r.id
    expect(r).toEqual({
        id: prefix,
        type: 'section',
        name: 'S1',
        floors: [
            {
                id: `${prefix}-1`,
                type: 'floor',
                name: '1',
                index: 1,
                units: [
                    {
                        id: `${prefix}-1-1`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-1-2`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-1-3`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-1-4`,
                        type: 'unit',
                    },
                ],
            },
            {
                id: `${prefix}--1`,
                type: 'floor',
                name: '-1',
                index: -1,
                units: [
                    {
                        id: `${prefix}--1-1`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}--1-2`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}--1-3`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}--1-4`,
                        type: 'unit',
                    },
                ],
            },
        ],
    })
})

test('createNewBBuildingSectionData(1, 1, 4)', () => {
    const r = createNewBBuildingSectionData({ sectionName: 'S1', minFloor: 1, maxFloor: 1, unitsPerFloor: 4 })
    const prefix = r.id
    expect(r).toEqual({
        id: prefix,
        type: 'section',
        name: 'S1',
        floors: [
            {
                id: `${prefix}-1`,
                type: 'floor',
                name: '1',
                index: 1,
                units: [
                    {
                        id: `${prefix}-1-1`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-1-2`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-1-3`,
                        type: 'unit',
                    },
                    {
                        id: `${prefix}-1-4`,
                        type: 'unit',
                    },
                ],
            },
        ],
    })
})

test('addNewBBuildingUnitToSectionData(TWO_SECTION_THREE_FLOORS.sections[0], 1, unit)', () => {
    const d = JSON.parse(JSON.stringify(TWO_SECTION_THREE_FLOORS))
    addNewBBuildingUnitToSectionData(d.sections[0], 1, { name: 'attic' })
    expect(d.sections[0].floors[1]).toEqual({
        'id': 5,
        'index': 1,
        'name': '1',
        'type': 'floor',
        'units': [
            {
                'id': 6,
                'name': '11',
                'type': 'unit',
            },
            expect.objectContaining({ name: 'attic', 'type': 'unit' }),
        ],
    })
})

test('addNewBBuildingUnitToSectionData(TWO_SECTION_THREE_FLOORS.sections[0], 3, unit)', () => {
    const d = JSON.parse(JSON.stringify(TWO_SECTION_THREE_FLOORS))
    addNewBBuildingUnitToSectionData(d.sections[0], 3, { name: 'attic' })
    expect(d.sections[0].floors).toEqual([
        expect.objectContaining({
            'index': 3,
            'name': '3',
            'type': 'floor',
            'units': [
                expect.objectContaining({ name: 'attic', 'type': 'unit' }),
            ],
        }),
        {
            id: 2,
            type: 'floor',
            name: '2',
            index: 2,
            units: [{ id: 3, type: 'unit', name: '22' }, { id: 4, type: 'unit', name: '23' }],
        },
        {
            id: 5,
            type: 'floor',
            name: '1',
            index: 1,
            units: [{ id: 6, type: 'unit', name: '11' }],
        },
    ])
})

test('addNewBBuildingUnitToSectionData(TWO_SECTION_THREE_FLOORS.sections[0], -3, unit)', () => {
    const d = JSON.parse(JSON.stringify(TWO_SECTION_THREE_FLOORS))
    addNewBBuildingUnitToSectionData(d.sections[0], -3, { name: 'attic' })
    expect(d.sections[0].floors).toEqual([
        {
            id: 2,
            type: 'floor',
            name: '2',
            index: 2,
            units: [{ id: 3, type: 'unit', name: '22' }, { id: 4, type: 'unit', name: '23' }],
        },
        {
            id: 5,
            type: 'floor',
            name: '1',
            index: 1,
            units: [{ id: 6, type: 'unit', name: '11' }],
        },
        expect.objectContaining({
            'index': -3,
            'name': '-3',
            'type': 'floor',
            'units': [
                expect.objectContaining({ name: 'attic', 'type': 'unit' }),
            ],
        }),
    ])
})
