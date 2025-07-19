const mkdirp = require('mkdirp')
const xlsx = require('xlsx')
/**
 * Required process arguments:
 * 1) Domain directory name <string> (Example: ticket) - this locates generated template to domain related path
 * 2) Template name <string> (Example: TicketDefaultExcelExportTemplate) - filename only
 * 3) Data mapper path <string> (Example: ../apps/condo/domains/ticket/serverSchema/xlsxDataMapper.js)
 * @returns {Promise<void>}
 * @example
 * yarn workspace @app/condo generate-excel-template someDomain someDomainExcelTemplate ./path/to/someDomainDataMapper.js
 */
const createXlsxTemplate = async () => {
    if (process.argv.length !== 5) {
        await Promise.reject('3 positional args required - domainDir, templateName, dataMapperPath')
    }
    const [domainDir, templateName, dataMapperPath] = process.argv.slice(2)
    // eslint-disable-next-line import/order
    const { header, rows } = require(dataMapperPath)({})
    const rowKeys = Object.keys(rows)

    for (const headerItem of Object.entries(header)) {
        const [locale, headerArray] = headerItem
        await mkdirp(`./domains/${domainDir}/templates/${locale}`, { recursive: true })
        const dataArray = [{}, {}]
        headerArray.forEach((rowKey, rowKeyIndex) => {
            const [firstRow, secondRow] = dataArray
            firstRow[rowKey] =  `{d.${domainDir}[i].${rowKeys[rowKeyIndex]}}`
            secondRow[rowKey] = `{d.${domainDir}[i + 1].${rowKeys[rowKeyIndex]}}`
        })

        const workSheet = xlsx.utils.json_to_sheet(dataArray, { header: headerArray })
        const workBook = xlsx.utils.book_new()
        xlsx.utils.book_append_sheet(workBook, workSheet)

        await xlsx
            .writeFileSync(workBook, `./domains/${domainDir}/templates/${locale}/${templateName}.xlsx`)
    }

}

createXlsxTemplate().then(() => {
    console.log('done creating template')
}).catch((e) => {
    console.error('Error creating template: ', e)
})
