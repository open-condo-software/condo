import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'

describe('Helpers property', () => {
    describe('getFiltersFromQuery', () => {
        describe('it should extract filters from query', () => {
            it('if valid JSON is provided', () => {
                expect(getFiltersFromQuery<{ [key: string]: string }>({ filters: '{"key": "value", "key2": "value"}' })).toStrictEqual({
                    key: 'value',
                    key2: 'value',
                })
            })
            it('if invalid JSON is provided', () => {
                expect(getFiltersFromQuery<{ [key: string]: string }>({ filters: '{"key": value, "key2": value}' })).toStrictEqual({})
            })
        })
    })
})
