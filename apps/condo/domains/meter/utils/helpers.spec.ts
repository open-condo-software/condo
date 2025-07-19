import { validateMeterValue, normalizeMeterValue } from './helpers'

describe('helpers', () => {
    describe('normalize and validate MeterValue', () => {
        const cases = [
            // cases is valid
            { value: undefined, isValid: true, normalized: undefined },
            { value: '', isValid: true, normalized: undefined },
            { value: '    ', isValid: true, normalized: undefined },
            { value: '  123,123  ', isValid: true, normalized: '123.123' }, // convert ',' to '.'
            { value: '1', isValid: true, normalized: '1' },
            { value: '111', isValid: true, normalized: '111' },
            { value: '1.2', isValid: true, normalized: '1.2' },
            { value: '0', isValid: true, normalized: '0' },
            { value: '0.00012', isValid: true, normalized: '0.00012' },
            { value: '00000', isValid: true, normalized: '0' },
            { value: '00000.001', isValid: true, normalized: '0.001' },
            { value: '0000.', isValid: true, normalized: '0' },
            { value: '1e-10', isValid: true, normalized: '1e-10' },
            { value: '0,1', isValid: true, normalized: '0.1' },
            { value: 1, isValid: true, normalized: '1' },
            { value: 0, isValid: true, normalized: '0' },
            { value: 1e-10, isValid: true, normalized: '1e-10' },

            // cases is not valid
            { value: 'NaN', isValid: false, normalized: 'NaN' },
            { value: '-1e-10', isValid: false, normalized: '-1e-10' },
            { value: '-123', isValid: false, normalized: '-123' },
            { value: '--123', isValid: false, normalized: 'NaN' },
            { value: '-', isValid: false, normalized: 'NaN' },
            { value: '123asd123', isValid: false, normalized: 'NaN' },
            { value: '000..00', isValid: false, normalized: 'NaN' },
            { value: '.', isValid: false, normalized: 'NaN' },
            { value: 'abc', isValid: false, normalized: 'NaN' },
            { value: null, isValid: false, normalized: null },
            { value: -0.001, isValid: false, normalized: '-0.001' },
            { value: [], isValid: false, normalized: null },
            { value: {}, isValid: false, normalized: null },
            { value: NaN, isValid: false, normalized: 'NaN' },
            { value: false, isValid: false, normalized: null },
            { value: true, isValid: false, normalized: null },
        ]

        it.each(cases)('should return expected value for: %s', ({ value, isValid, normalized }) => {
            const normalizedValue = normalizeMeterValue(value)
            const isValidValue = validateMeterValue(normalized)

            expect(normalizedValue).toBe(normalized)
            expect(isValidValue).toBe(isValid)
        })
    })
})
