const { generateAddressKey, JOINER, SPACE_REPLACER } = require('@address-service/domains/common/utils/addressKeyUtils')
const { createTestAddressPartWithType } = require('@address-service/domains/address/utils/testSchema')

describe('Address key utils', () => {
    describe('will generate the correct address key', () => {
        /**
         * @type {NormalizedBuildingData[]}
         */
        const cases = [
            [
                {
                    country: 'Some  country ',
                    region: 'far \r  \n\t    region',
                    area: '\t',
                    city: 'The \t N\nCity',
                    city_district: 'District 19',
                    settlement: '',
                    street: '  Straight\tstreet',
                    house: 42,
                    block: ' ',
                },
                `some${SPACE_REPLACER}country${JOINER}far${SPACE_REPLACER}region${JOINER}the${SPACE_REPLACER}n${SPACE_REPLACER}city${JOINER}district${SPACE_REPLACER}19${JOINER}straight${SPACE_REPLACER}street${JOINER}42`,
            ],
            [
                {
                    country: 'Molvania',
                    region: 'South district',
                    settlement: 'Stone creek',
                    house: '42',
                },
                `molvania${JOINER}south${SPACE_REPLACER}district${JOINER}stone_creek${JOINER}42`,
            ],
        ]

        test.each(cases)('%p should be converted to `%s`', (data, expected) => {
            const t = generateAddressKey({ data, value: 'some value unnecessary for this test', unrestricted_value: '' })
            expect(t).toBe(expected)
        })
    })
})
