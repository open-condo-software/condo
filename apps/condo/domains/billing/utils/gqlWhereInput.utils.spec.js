const { removeKeysFromObjectDeep } = require('./gqlWhereInput.utils')

describe('gqlWhereInput utils', () => {

    const testCases = [
        {
            name: 'empty object',
            input: {},
            keysToRemove: ['sc'],
            output: {},
        },
        {
            name: 'simple key removal',
            input: { sc: { id: '1' }, name: 'test' },
            keysToRemove: ['sc'],
            output: { name: 'test' },
        },
        {
            name: 'nested keys are not removed',
            input: {
                sc: { id: '1' },
                item: {
                    sc: { param: 'value' },
                    name: 'nested',
                },
            },
            keysToRemove: ['sc'],
            output: {
                item: {
                    // sc here is not removed because it is part of other entity fields
                    sc: { param: 'value' },
                    name: 'nested',
                },
            },
        },
        {
            name: 'AND/OR logic preservation',
            input: {
                AND: [
                    { sc: { id: '1' }, name: 'first' },
                    { sc: { id: '2' }, name: 'second' },
                ],
                OR: [
                    { sc: { param: 'value' } },
                ],
            },
            keysToRemove: ['sc'],
            output: {
                AND: [
                    { name: 'first' },
                    { name: 'second' },
                ],
                OR: [{}],
            },
        },
        {
            name: 'array handling',
            input: {
                OR: [
                    { sc: { id: '1' }, name: 'array-item' },
                    { sc: { id: '2' } },
                ],
            },
            keysToRemove: ['sc'],
            output: {
                OR: [
                    { name: 'array-item' },
                    // here sc is removed because it is first level item of WhereInput (AND: [WhereInput])
                    {},
                ],
            },
        },
        {
            name: 'multiple keys removal',
            input: {
                sc: { id: '1' },
                temp: 'value',
                item: { sc: { id: '2' }, temp: 'nested' },
            },
            keysToRemove: ['sc', 'temp'],
            output: {
                item: { sc: { id: '2' }, temp: 'nested' },
            },
        },
        {
            name: 'no keys to remove',
            input: { sc: { id: '1' } },
            keysToRemove: [],
            output: { sc: { id: '1' } },
        },
        {
            name: 'complex nested structure',
            input: {
                sc: { id: 'root' },
                AND: [
                    {
                        sc: { id: '1' },
                        OR: [
                            { sc: { id: '2' }, name: 'deep' },
                        ],
                    },
                    { item: { name: 'test' } },
                ],
            },
            keysToRemove: ['sc'],
            output: {
                AND: [
                    {
                        OR: [
                            { name: 'deep' },
                        ],
                    },
                    { item: { name: 'test' } },
                ],
            },
        },
        {
            name: 'non-array keysToRemove',
            input: { sc: { id: '1' } },
            keysToRemove: 'sc',
            output: {},
        },
    ]

    test.each(testCases)('$name', ({ input, keysToRemove, output }) => {
        expect(removeKeysFromObjectDeep(input, keysToRemove)).toEqual(output)
    })

})