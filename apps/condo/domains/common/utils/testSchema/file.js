const fetch = require('node-fetch')
const fs = require('fs')
const xlsx = require('xlsx')
const os = require('os')
const { getRandomString } = require('@open-condo/keystone/test.utils')

async function downloadFile (url, path) {
    const res = await fetch(url)
    if (res.status !== 200) throw new Error(`downloadFile(): status=${res.status}`)
    const buffer = await res.buffer()
    fs.writeFileSync(path, buffer)
}

/**
 * Some third-party writer tools will not update the dimensions records in XLSX or XLS or XLSB exports.
 * SheetJS utility functions will skip values not in range.
 * This helper function will recalculate the range:
 * https://docs.sheetjs.com/docs/miscellany/errors#worksheet-only-includes-one-row-of-data
 *
 * Issue with same problem: https://github.com/SheetJS/sheetjs/issues/1557
 * @param worksheet
 */
function updateSheetRange (worksheet) {
    const range = {
        s: { r: Infinity, c: Infinity },
        e: { r: 0, c: 0 }
    }
    Object.keys(worksheet)
        .filter((key) => key.charAt(0) !== "!")
        .map(xlsx.utils.decode_cell)
        .forEach((cell) => {
            range.s.c = Math.min(range.s.c, cell.c)
            range.s.r = Math.min(range.s.r, cell.r)
            range.e.c = Math.max(range.e.c, cell.c)
            range.e.r = Math.max(range.e.r, cell.r)
        })
    worksheet['!ref'] = xlsx.utils.encode_range(range)
}

async function readXlsx (path) {
    const workbook = xlsx.readFile(path)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    updateSheetRange(sheet)
    return xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' }).filter(x => x.join(''))
}

function expectDataFormat (data, res) {
    expect(JSON.stringify(data, null, 2)).toEqual(JSON.stringify(res, null, 2))
}

function getTmpFile (extension = 'txt') {
    return `${os.tmpdir()}/${getRandomString()}.${extension}`
}

module.exports = {
    downloadFile,
    readXlsx,
    getTmpFile,
    expectDataFormat,
}
