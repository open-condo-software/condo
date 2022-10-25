const { generateAddressKey, JOINER } = require('@address-service/domains/common/utils/addressKeyUtils')

describe('Address utils', () => {
    describe('generates correct address key', () => {
        const country = 'Some  country'
        const region = 'far     region'
        const area = ''
        const city = 'The N\nCity'
        const settlement = ''
        const street = 'Straight\tstreet'
        const building = 42
        const block = ''

        const cases = [
            [
                { country, region, area, city, settlement, street, building, block },
                `some_country${JOINER}far_region${JOINER}the_n_city${JOINER}straight_street${JOINER}42`,
            ],
        ]

        test.each(cases)('%p should be converted to `%s`', (data, expected) => {
            const t = generateAddressKey({ data, value: 'some value unnecessary for this test' })
            expect(t).toBe(expected)
        })
    })
})
