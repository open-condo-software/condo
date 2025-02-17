import { getAppKeyPrefix } from './keyPrefix'

describe('Key prefixing utils', () => {
    describe('getAppKeyPrefix', () => {
        test('Must omit scope', () => {
            expect(getAppKeyPrefix('@app/condo')).toEqual('condo')
            expect(getAppKeyPrefix('@other-long-scope/condo')).toEqual('condo')
        })
        test('Must replace "-" with "_"', () => {
            expect(getAppKeyPrefix('@app/multiple-words-app')).toEqual('multiple_words_app')
            expect(getAppKeyPrefix('multiple-words-app')).toEqual('multiple_words_app')
        })
        test('Must cast result to lower case', () => {
            expect(getAppKeyPrefix('@app/Multiple-WORDS-app')).toEqual('multiple_words_app')
            expect(getAppKeyPrefix('@aPP/CoNdO')).toEqual('condo')
        })
        describe('Real scenarios test', () => {
            const cases = [
                ['@open-condo/keystone', 'keystone'],
                ['@app/address-service', 'address_service'],
                ['@app/condo', 'condo'],
                ['@app/dev-portal-api', 'dev_portal_api'],
                ['@app/employee-bot', 'employee_bot'],
                ['@app/eps', 'eps'],
                ['@app/external-api', 'external_api'],
                ['@app/insurance', 'insurance'],
                ['@app/meter-importer', 'meter_importer'],
                ['@app/miniapp', 'miniapp'],
                ['@app/news-greenhouse', 'news_greenhouse'],
                ['@app/pass', 'pass'],
                ['@app/property-importer', 'property_importer'],
                ['@app/rb', 'rb'],
                ['@app/registry-importer', 'registry_importer'],
                ['@app/telephony', 'telephony'],
                ['@app/ticket-importer', 'ticket_importer'],
            ]
            test.each(cases)('%p', (appName, expectedPrefix) => {
                expect(getAppKeyPrefix(appName)).toEqual(expectedPrefix)
            })
        })
    })
})