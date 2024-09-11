const { fetch } = require('@open-condo/keystone/fetch')
const fs = require('fs')
const xlsx = require('xlsx')
const os = require('os')
const { getRandomString } = require('@open-condo/keystone/test.utils')

async function downloadFile (url, path) {
    const res = await fetch(url)
    if (res.status !== 200) throw new Error(`downloadFile(): status=${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(path, buffer)
}

async function readXlsx (path) {
    const workbook = xlsx.readFile(path)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
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
