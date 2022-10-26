const { generateAddressKey, JOINER, SPACE_REPLACER } = require('@address-service/domains/common/utils/addressKeyUtils')

describe('Address key utils', () => {
    describe('generates correct address key', () => {
        const cases = [
            [
                {
                    country: 'Some  country',
                    region: 'far \r\n\t    region',
                    area: '',
                    city: 'The N\nCity',
                    settlement: '',
                    street: 'Straight\tstreet',
                    building: 42,
                    block: '',
                },
                `some${SPACE_REPLACER}country${JOINER}far${SPACE_REPLACER}region${JOINER}the${SPACE_REPLACER}n${SPACE_REPLACER}city${JOINER}straight${SPACE_REPLACER}street${JOINER}42`,
            ],
            [
                { country: 'Molvania', region: 'South district', settlement: 'Stone creek', building: '42' },
                `molvania${JOINER}south${SPACE_REPLACER}district${JOINER}stone_creek${JOINER}42`,
            ],
        ]

        test.each(cases)('%p should be converted to `%s`', (data, expected) => {
            const t = generateAddressKey({ data, value: 'some value unnecessary for this test' })
            expect(t).toBe(expected)
        })
    })
})
