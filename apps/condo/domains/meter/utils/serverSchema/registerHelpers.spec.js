const { getSortedValues, createMeterReadingKey } = require('./registerHelpers')

describe('registerHelpers', () => {
    describe('getSortedValues', () => {
        const testCases = [
            {
                name: 'should return sorted values for reading with all meter values',
                reading: { value1: '100.5', value2: '200.3', value3: '300.7', value4: '400.1' },
                expected: ['100.5', '200.3', '300.7', '400.1'],
            },
            {
                name: 'should return sorted values for reading with all unordered meter values',
                reading: { value3: '300.7', value1: '100.5', value4: '400.1', value2: '200.3' },
                expected: ['100.5', '200.3', '300.7', '400.1'],
            },
            {
                name: 'should return sorted values excluding null values',
                reading: { value1: '100.5', value2: null, value3: '300.7', value4: '400.1' },
                expected: ['100.5', '300.7', '400.1'],
            },
            {
                name: 'should return sorted values excluding undefined values',
                reading: { value1: '100.5', value2: undefined, value3: '300.7', value4: '400.1' },
                expected: ['100.5', '300.7', '400.1'],
            },
            {
                name: 'should return empty array when all values are null or undefined',
                reading: { value1: null, value2: undefined, value3: null, value4: undefined },
                expected: [],
            },
            {
                name: 'should handle reading with only one value',
                reading: { value1: null, value2: '200.3', value3: null, value4: null },
                expected: ['200.3'],
            },
            {
                name: 'should handle reading with numeric values',
                reading: { value1: 100.5, value2: 200.3, value3: null, value4: 400.1 },
                expected: ['100.5', '200.3', '400.1'],
            },
            {
                name: 'should handle reading with zero values',
                reading: { value1: 0, value2: '0', value3: null, value4: '100.5' },
                expected: ['0', '0', '100.5'],
            },
            {
                name: 'should handle reading with empty string values (should be excluded)',
                reading: { value1: '', value2: '200.3', value3: null, value4: '400.1' },
                expected: ['200.3', '400.1'],
            },
            {
                name: 'should handle reading with mixed data types',
                reading: { value1: '100.5', value2: 200, value3: '300.7', value4: 0 },
                expected: ['100.5', '200', '300.7', '0'],
            },
            {
                name: 'should handle reading with additional non-value properties',
                reading: {
                    value1: '100.5',
                    value2: '200.3',
                    value3: null,
                    value4: '400.1',
                    date: '2023-01-01',
                    meterNumber: '12345',
                    accountNumber: 'ACC001',
                },
                expected: ['100.5', '200.3', '400.1'],
            },
        ]

        test.each(testCases)('$name', ({ reading, expected }) => {
            const result = getSortedValues(reading)
            expect(result).toEqual(expected)
        })
    })

    describe('createMeterReadingKey', () => {
        test('should create key with meter id and sorted values', () => {
            const meterId = 'meter-123-uuid'
            const sortedValues = ['100.5', '200.3', '300.7']

            const result = createMeterReadingKey(meterId, sortedValues)
            expect(result).toBe('meter-123-uuid_100.5_200.3_300.7')
        })

        test('should create key with single value', () => {
            const meterId = 'meter-456-uuid'
            const sortedValues = ['150.2']

            const result = createMeterReadingKey(meterId, sortedValues)
            expect(result).toBe('meter-456-uuid_150.2')
        })

        test('should create key with empty values array', () => {
            const meterId = 'meter-789-uuid'
            const sortedValues = []

            const result = createMeterReadingKey(meterId, sortedValues)
            expect(result).toBe('meter-789-uuid_')
        })

        test('should create key with numeric values', () => {
            const meterId = 'meter-abc-uuid'
            const sortedValues = [100, 200.5, 300]

            const result = createMeterReadingKey(meterId, sortedValues)
            expect(result).toBe('meter-abc-uuid_100_200.5_300')
        })

        test('should create key with zero values', () => {
            const meterId = 'meter-def-uuid'
            const sortedValues = [0, '0', 100.5]

            const result = createMeterReadingKey(meterId, sortedValues)
            expect(result).toBe('meter-def-uuid_0_0_100.5')
        })

        test('should handle special characters in values', () => {
            const meterId = 'meter-ghi-uuid'
            const sortedValues = ['100.5', '200,3', '300-7']

            const result = createMeterReadingKey(meterId, sortedValues)
            expect(result).toBe('meter-ghi-uuid_100.5_200,3_300-7')
        })

        test('should handle long meter id', () => {
            const meterId = 'very-long-meter-id-with-many-characters-uuid-12345'
            const sortedValues = ['100.5', '200.3']

            const result = createMeterReadingKey(meterId, sortedValues)
            expect(result).toBe('very-long-meter-id-with-many-characters-uuid-12345_100.5_200.3')
        })

        test('should handle values with underscores (potential conflict with separator)', () => {
            const meterId = 'meter-jkl-uuid'
            const sortedValues = ['100_5', '200_3', '300_7']

            const result = createMeterReadingKey(meterId, sortedValues)
            expect(result).toBe('meter-jkl-uuid_100_5_200_3_300_7')
        })

        test('should create unique keys for different meter ids with same values', () => {
            const sortedValues = ['100.5', '200.3']

            const key1 = createMeterReadingKey('meter-1-uuid', sortedValues)
            const key2 = createMeterReadingKey('meter-2-uuid', sortedValues)

            expect(key1).toBe('meter-1-uuid_100.5_200.3')
            expect(key2).toBe('meter-2-uuid_100.5_200.3')
            expect(key1).not.toBe(key2)
        })

        test('should create unique keys for same meter id with different values', () => {
            const meterId = 'meter-same-uuid'

            const key1 = createMeterReadingKey(meterId, ['100.5', '200.3'])
            const key2 = createMeterReadingKey(meterId, ['100.5', '200.4'])

            expect(key1).toBe('meter-same-uuid_100.5_200.3')
            expect(key2).toBe('meter-same-uuid_100.5_200.4')
            expect(key1).not.toBe(key2)
        })
    })

    describe('getSortedValues and createMeterReadingKey integration', () => {
        test('should work together to create consistent keys for same readings', () => {
            const reading1 = {
                value1: '100.5',
                value2: null,
                value3: '300.7',
                value4: '400.1',
            }

            const reading2 = {
                value1: '100.5',
                value2: undefined,
                value3: '300.7',
                value4: '400.1',
            }

            const meterId = 'meter-test-uuid'

            const sortedValues1 = getSortedValues(reading1)
            const sortedValues2 = getSortedValues(reading2)

            const key1 = createMeterReadingKey(meterId, sortedValues1)
            const key2 = createMeterReadingKey(meterId, sortedValues2)

            expect(key1).toBe(key2)
            expect(key1).toBe('meter-test-uuid_100.5_300.7_400.1')
        })

        test('should create different keys for readings with different values', () => {
            const reading1 = {
                value1: '100.5',
                value2: '200.3',
                value3: null,
                value4: null,
            }

            const reading2 = {
                value1: '100.5',
                value2: '200.4',
                value3: null,
                value4: null,
            }

            const meterId = 'meter-test-uuid'

            const sortedValues1 = getSortedValues(reading1)
            const sortedValues2 = getSortedValues(reading2)

            const key1 = createMeterReadingKey(meterId, sortedValues1)
            const key2 = createMeterReadingKey(meterId, sortedValues2)

            expect(key1).not.toBe(key2)
            expect(key1).toBe('meter-test-uuid_100.5_200.3')
            expect(key2).toBe('meter-test-uuid_100.5_200.4')
        })
    })
})