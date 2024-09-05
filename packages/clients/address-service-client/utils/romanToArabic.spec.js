const { convertRomanToArabic, detectRomanNumerals, replaceRomanWithArabicNumbers } = require('./romanToArabic')


describe('romanToArabic', () => {

    describe('convertRomanToArabic', () => {
        test.each([
            ['v', 5],
            ['vi', 6],
            ['vii', 7],
            ['I', 1],
            ['IV', 4],
            ['V', 5],
            ['IX', 9],
            ['X', 10],
            ['XL', 40],
            ['L', 50],
            ['XC', 90],
            ['C', 100],
            ['CD', 400],
            ['D', 500],
            ['CM', 900],
            ['M', 1000],
            ['MCMLXXXIV', 1984],
        ])(
            'Should convert "%s" to "%i"',
            (roman, arabic) => 
                expect(convertRomanToArabic(roman)).toEqual(arabic)
        )
    })

    describe('detectRomanNumerals', () => {
        test.each([
            ['V', [{ index: 0, value: 'V' }]],
            ['V I', [{ index: 0, value: 'V' }, { index: 2, value: 'I' }]],
            ['asd V asd', [{ index: 4, value: 'V' }]],
            ['asdV', []],
        ])(
            'should detect properly in "%s"', (inputStr, expected) =>
                expect(detectRomanNumerals(inputStr)).toEqual(expected)
        )
    })

    describe('replaceRomanWithArabicNumbers', () => {
        test.each([
            ['V', '5'],
            ['V I', '5 1'],
            ['asd V asd', 'asd 5 asd'],
            ['asdV', 'asdV'],
        ])(
            'should convert "%s" to "%s"', (inputStr, expected) =>
                expect(replaceRomanWithArabicNumbers(inputStr)).toEqual(expected)
        )
    })

})