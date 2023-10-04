const { DadataSuggestionProvider } = require('./DadataSuggestionProvider')
describe('DadataSuggestionProvider', () => {
    describe('Trailing space added correctly', () => {
        const cases = [
            ['дом 345', 'дом 345 '],
            ['дом 23 ', 'дом 23 '],
            ['дом 32В', 'дом 32В '],
            ['дом 2ж ', 'дом 2ж '],
            ['дом 4 А', 'дом 4 А '],
            ['дом 4 ф ', 'дом 4 ф '],
            ['дом 4  д ', 'дом 4  д'],
            ['улица', 'улица'],
            ['адрес ', 'адрес'],
        ]

        test.each(cases)('%p', (address, expected) => {
            expect(DadataSuggestionProvider.prepareQuery(address)).toEqual(expected)
        })
    })
})
