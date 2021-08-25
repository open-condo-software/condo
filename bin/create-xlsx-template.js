const xlsx = require('xlsx')
const mkdirp = require('mkdirp')

const createXlsxTemplate = async () => {
    if (process.argv.length !== 5) {
        await Promise.reject('3 positional args required - domainDir, templateName, dataMapperPath')
    }
    const [domainDir, templateName, dataMapperPath] = process.argv.slice(2)
    const { header, rows } = require(dataMapperPath)({ domainName: domainDir, rows: [] })
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
