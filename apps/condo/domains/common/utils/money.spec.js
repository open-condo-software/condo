const { renderMoney } = require('./money')

describe('Tests renderMoney with different locales and currency ', () => {
    describe('renderMoney called with "en" locale and "USD" currency ', () => {
        const locale = 'en'
        const currency = 'USD'

        const differentAmount = [
            [0, '0.00'],
            [10, '10.00'],
            [100, '100.00'],
            [1000, '1,000.00'],
            [10000, '10,000.00'],
            [100000, '100,000.00'],
            [1000000, '1,000,000.00'],
            [10000000, '10,000,000.00'],
            [1000.15, '1,000.15'],
            [1000000.15, '1,000,000.15'],
            [-100.11, '-100.11'],
            [0.00, '0.00'],
            ['10000.10000', '10,000.10'],
            [10000.300, '10,000.30'],
            ['0.00', '0.00'],
            ['10000.10000', '10,000.10'],
        ]

        test.each(differentAmount)('Input %d => Output %s', (amount, expected) => {
            expect(renderMoney(amount, currency, locale)).toBe(expected)
        })
    })   

    describe('renderMoney called with "ru" locale and "RUB" currency ', () => {
        const locale = 'ru'
        const currency = 'RUB'

        const differentAmount = [
            [0, '0,00'],
            [10, '10,00'],
            [100, '100,00'],
            [1000, '1 000,00'],
            [10000, '10 000,00'],
            [100000, '100 000,00'],
            [1000000, '1 000 000,00'],
            [10000000, '10 000 000,00'],
            [1000.15, '1 000,15'],
            [1000000.15, '1 000 000,15'],
            [10000.15, '10 000,15'],
            [-100.11, '-100,11'],
            [0.00, '0,00'],
            ['10000.10000', '10 000,10'],
            [10000.300, '10 000,30'],
            ['0.00', '0,00'],
            ['10000.10000', '10 000,10'],
            [' ', ''],
            ['', ''],
            ['QWERTY', ''],
        ]

        test.each(differentAmount)('Input %d => Output %s', (amount, expected) => {
            expect(renderMoney(amount, currency, locale)).toBe(expected)
        })
    })   
})
