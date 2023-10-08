const { isEmpty, get } = require('lodash')

const { getTranslations } = require('@open-condo/locales/loader')

const { LOCALES } = require('@condo/domains/common/constants/locale')
const { EXCEL_TEMPLATES_HEADERS, translationStringKeyForExcelExportHeader } = require('@condo/domains/common/utils/exportToExcel')

describe('Export to excel', () => {
    it('All Excel templates headers has all translations', () => {
        let result = true

        for (const locale of Object.keys(LOCALES)) {
            const strings = getTranslations(locale)
            const registries = Object.keys(EXCEL_TEMPLATES_HEADERS)
            for (const registry of registries) {
                const columnHeaders = EXCEL_TEMPLATES_HEADERS[registry]
                for (const columnHeader of columnHeaders) {
                    const targetKey = translationStringKeyForExcelExportHeader(registry, columnHeader)
                    if (isEmpty(get(strings, targetKey, null))) {
                        console.error(`There is no "${targetKey}" translation in ${locale}.json`)
                        result = false
                    }
                }
            }
        }

        expect(result).toEqual(true)
    })
})
