const { LOCALES } = require('@condo/domains/common/constants/locale')
const { METER_READING_BILLING_STATUSES } = require('@condo/domains/meter/constants/constants')

const LOCALE_MESSAGES = Object.keys(LOCALES).map(locale => ({
    name: locale,
    messages: require(`@app/condo/lang/${locale}/${locale}.json`),
}))

describe('meter constants translations', () => {
    describe('billingStatus values have translation keys in all locales', () => {
        test.each(METER_READING_BILLING_STATUSES)('billingStatus `%s` must have translation in all locales', (status) => {
            const key = `excelExport.headers.meters.billingStatus.${status}`
            LOCALE_MESSAGES.forEach(({ messages }) => {
                expect(messages).toHaveProperty([key])
            })
        })
    })
})
