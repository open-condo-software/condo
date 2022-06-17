const carbone = require('carbone')
const FileAdapter = require('./fileAdapter')
const { Duplex } = require('stream')
const path = require('path')
const { v4: uuid } = require('uuid')
const { Readable } = require('stream')

const EXCEL_FILE_META = {
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    encoding: 'UTF-8',
}

const render = (pathToTemplate, replaces) => new Promise((resolve, reject) => {
    carbone.render(pathToTemplate, replaces, (err, result) => {
        if (err) {
            return reject(err)
        } else {
            return resolve(result)
        }
    })
})

// This function uses file saving apart from internal working of `File` field in Keystone schema
// It makes unable to save data to `File` field server-side
// @deprecated
async function createExportFile ({ fileName, templatePath, replaces, meta }) {
    const ExportFileAdapter = new FileAdapter('export')
    const fileContent = await render(path.resolve(templatePath), replaces)
    const buffer = new Duplex()
    buffer.push(fileContent)
    buffer.push(null)
    const id = uuid()
    // TODO(zuch): add mime types and encoding detector from template
    // mimetype: 'application/vnd.oasis.opendocument.spreadsheet', - for ods
    const fileInfo = await ExportFileAdapter.save({
        stream: buffer,
        id,
        filename: fileName,
        meta,
        ...EXCEL_FILE_META,
    })
    const { filename } = fileInfo
    const url = ExportFileAdapter.publicUrl({ filename })
    return { url, fileInfo }
}

/**
 * Only builds file content and supposes that it will be saved somewhere
 * TODO(antonal): make this function to work with many formats, not only Excel
 * @param templatePath path to Excel file template
 * @param replaces
 * @return {Promise<{ stream }>}
 */
async function buildExportFile ({ templatePath, replaces }) {
    const content = await render(path.resolve(templatePath), replaces)
    const stream = Readable.from(content)
    return { stream }
}

module.exports = {
    EXCEL_FILE_META,
    createExportFile,
    buildExportFile,
}
